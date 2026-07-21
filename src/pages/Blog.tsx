import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Clock, User, Search, ChevronRight, Loader2, BookOpen, X, Mail, Send, Check, Pen } from 'lucide-react';
import { getBlogPosts, BlogPost, toggleBlogLike, subscribeToNewsletter } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import EmptyState from '../components/ui/EmptyState';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
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
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  useLockBodyScroll(newsletterOpen);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

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
    if (page > 0) {
      fetchPosts(page, false);
    }
  }, [page]);

  const fetchPosts = async (pageToFetch: number, isInitial: boolean) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await getBlogPosts(pageToFetch, 6, searchTerm || undefined);

      if (res.success && res.data) {
        setPosts(prev => isInitial ? res.data! : [...prev, ...res.data!]);
        setHasMore(res.hasMore || false);
      } else if (!res.success) {
        console.error('[Blog] Error fetching posts:', res.error);
        toast.error('No se pudieron cargar las publicaciones. Intenta de nuevo.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[Blog] Unexpected error fetching posts:', message);
      toast.error('No se pudieron cargar las publicaciones. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!user) { toast.error('Inicia sesión'); return; }
    const res = await toggleBlogLike(user.id, id, 'post');
    if (res.success) {
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, likes_count: res.action === 'added' ? p.likes_count + 1 : p.likes_count - 1 } : p
      ));
    } else {
      toast.error(res.error || 'Error al marcar favorito');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO
        title="Blog de Comunidad"
        description="Historias, consejos y novedades de nuestro Guía y los mejores negocios de AgendaYa."
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 sm:space-y-5">

        {/* ═══ HEADER (dashboard style) ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
              <Pen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                Blog de Comunidad
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Historias, consejos y novedades de los mejores negocios
              </p>
            </div>
          </div>
        </div>

        {/* ═══ SEARCH + CTA (compact row) ═══ */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar publicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-xs font-medium min-h-[36px]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all min-h-[36px]"
            >
              🌐 Crear web gratis →
            </Link>
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
              {posts.map((post, index) => {
                const isLast = index === posts.length - 1;
                return (
                  <div
                    key={post.id}
                    ref={isLast ? lastPostElementRef : undefined}
                  >
                    <Link
                      to={`/blog/${post.id}`}
                      className="group block h-full"
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                      {/* Image */}
                      <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        {post.image_url ? (
                          <img src={post.image_url} alt={post.title} loading="lazy" width={400} height={192} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
                              <button type="button" onClick={(e) => handleLike(e, post.id)} className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded" aria-label={post.likes_count > 0 ? 'Quitar me gusta' : 'Me gusta'} aria-pressed={post.likes_count > 0}>
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
                );
              })}
                    </div>

            {/* Loading more */}
            {loadingMore && (
              <div className="flex justify-center py-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <span className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Cargando más...</span>
                </div>
              </div>
            )}

            {/* End indicator */}
            {!hasMore && posts.length > 0 && (
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

      {/* Botón flotante del Newsletter */}
      <button
        onClick={() => setNewsletterOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 text-white rounded-lg shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 active:scale-95 transition-all duration-300 group"
      >
        <div className="relative">
          <Mail className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <span className="font-bold text-sm">Newsletter</span>
      </button>

      {/* Modal del Newsletter */}
      {newsletterOpen && (
        <NewsletterModal onClose={() => setNewsletterOpen(false)} />
      )}
    </div>
  );
};

const NewsletterModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un correo válido');
      return;
    }
    setSubscribing(true);
    const res = await subscribeToNewsletter(email.trim());
    setSubscribing(false);
    if (res.success) {
      setSubscribed(true);
      setEmail('');
      toast.success('¡Suscrito al newsletter!');
      setTimeout(() => setSubscribed(false), 5000);
    } else {
      toast.error(res.error || 'Error al suscribir');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-lg p-8 sm:p-10 shadow-2xl shadow-primary-500/30 text-center animate-in zoom-in-95 duration-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)] pointer-events-none rounded-lg" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10">
          <div className="w-14 h-14 mx-auto mb-5 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Newsletter AgendaYa</h3>
          <p className="text-white/70 text-sm font-medium mb-7 max-w-xs mx-auto">
            Recibe consejos, novedades y ofertas exclusivas de los mejores negocios.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-emerald-200 font-bold py-4">
              <Check className="w-5 h-5" />
              ¡Gracias por suscribirte!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-4 py-3.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={subscribing || !email.trim()}
                className="w-full px-6 py-3.5 bg-white text-primary-700 font-black text-sm rounded-lg hover:bg-primary-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Suscribirme <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blog;
