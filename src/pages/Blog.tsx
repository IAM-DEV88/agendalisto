import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Clock, User, Search, ChevronRight, Loader2, BookOpen, X } from 'lucide-react';
import { getBlogPosts, BlogPost, toggleBlogLike } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import EmptyState from '../components/ui/EmptyState';

function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-slate-800" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
      </div>
    </div>
  );
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchTerm) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, searchTerm]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    setPage(0);
    setPosts([]);
    setHasMore(true);
    fetchPosts(0, true);
  }, [searchTerm]);

  useEffect(() => {
    if (page > 0 && !searchTerm) {
      fetchPosts(page, false);
    }
  }, [page]);

  const fetchPosts = async (pageToFetch: number, isInitial: boolean) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    const res = await getBlogPosts(pageToFetch, 6);

    if (res.success && res.data) {
      setPosts(prev => isInitial ? res.data! : [...prev, ...res.data!]);
      setHasMore(res.hasMore || false);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!user) { toast.error('Inicia sesión'); return; }
    const res = await toggleBlogLike(user.id, id, 'post');
    if (res.success) {
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, likes_count: res.action === 'added' ? p.likes_count + 1 : p.likes_count - 1 } : p
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200 py-12">
      <SEO
        title="Blog de Comunidad"
        description="Historias, consejos y novedades de nuestro Guía y los mejores negocios de AgendaYa."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary-200 dark:ring-primary-800">
            <BookOpen className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Blog de Comunidad
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Historias, consejos y novedades de nuestro Guía y los mejores negocios de AgendaYa.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar publicaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {[1, 2, 3, 4, 5, 6].map(i => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No se encontraron publicaciones"
              description={searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Aún no hay publicaciones. Vuelve pronto.'}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  ref={index === posts.length - 1 ? lastPostElementRef : undefined}
                >
                  <Link
                    to={`/blog/${post.id}`}
                    className="group block h-full"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    {/* Image */}
                    <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {post.image_url ? (
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                          <User className="w-3 h-3" />
                          {post.author_name}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-tight">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                        {post.excerpt || post.content.substring(0, 120) + '...'}
                      </p>

                      {/* Footer */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-slate-500 hover:text-rose-500 transition-colors text-xs font-bold">
                            <button onClick={(e) => handleLike(e, post.id)} className="flex items-center gap-1.5">
                              <Heart className={`w-4 h-4 ${post.likes_count > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                              {post.likes_count}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                            <MessageSquare className="w-4 h-4" />
                            {post.comment_count}
                          </div>
                        </div>
                        <span className="text-primary-600 dark:text-primary-400 font-black text-xs uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Leer más <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                 </Link>
                </div>
               ))}
            </div>

            {/* Loading more */}
            {loadingMore && (
              <div className="flex justify-center py-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <span className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Cargando más...</span>
                </div>
              </div>
            )}

            {/* End indicator */}
            {!hasMore && posts.length > 0 && !searchTerm && (
              <div className="text-center py-10 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Has llegado al final</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
