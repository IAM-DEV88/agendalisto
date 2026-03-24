import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Clock, User, ArrowRight, Search, ChevronRight } from 'lucide-react';
import { getBlogPosts, BlogPost, toggleBlogLike } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchPosts();
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const res = await getBlogPosts();
    if (res.success && res.data) {
      setPosts(res.data);
    }
    setLoading(false);
  };

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!user) {
      toast.error('Inicia sesión para dar me gusta');
      return;
    }
    const res = await toggleBlogLike(user.id, id, 'post');
    if (res.success) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes_count: res.action === 'added' ? p.likes_count + 1 : p.likes_count - 1 } : p));
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Blog de Comunidad</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Historias, consejos y novedades de nuestro Guía y los mejores negocios de AgendaYa.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar publicaciones..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-slate-500 font-bold animate-pulse">Cargando publicaciones...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 card bg-white dark:bg-slate-800">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No se encontraron publicaciones</h3>
            <p className="text-slate-500">Intenta con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.id}`} className="group">
                <div className="card h-full flex flex-col hover:border-primary-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <MessageSquare className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400"><User className="w-3.5 h-3.5" /> {post.author_name}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {post.excerpt || post.content.substring(0, 100) + '...'}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={(e) => handleLike(e, post.id)} className="flex items-center gap-1.5 text-slate-500 hover:text-rose-500 transition-colors text-xs font-bold">
                          <Heart className={`w-4 h-4 ${post.likes_count > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                          {post.likes_count}
                        </button>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
