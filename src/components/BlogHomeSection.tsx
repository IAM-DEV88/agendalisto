import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, ArrowRight, Clock, User } from 'lucide-react';
import { getLatestBlogPost, getPopularPosts, BlogPost, toggleBlogLike } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const BlogHomeSection = () => {
  const [latestPost, setLatestPost] = useState<BlogPost | null>(null);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const [latestRes, popularRes] = await Promise.all([
        getLatestBlogPost(),
        getPopularPosts(4)
      ]);

      if (latestRes.success && latestRes.data) setLatestPost(latestRes.data);
      if (popularRes.success && popularRes.data) setPopularPosts(popularRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLike = async (e: React.MouseEvent, id: string, type: 'post') => {
    e.preventDefault();
    if (!user) {
      toast.error('Inicia sesión para dar me gusta');
      return;
    }
    const res = await toggleBlogLike(user.id, id, type);
    if (res.success) {
      if (latestPost?.id === id) {
        setLatestPost(prev => prev ? { ...prev, likes_count: res.action === 'added' ? prev.likes_count + 1 : prev.likes_count - 1 } : null);
      } else {
        setPopularPosts(prev => prev.map(p => p.id === id ? { ...p, likes_count: res.action === 'added' ? p.likes_count + 1 : p.likes_count - 1 } : p));
      }
    } else {
      toast.error(res.error || 'Error al marcar favorito');
    }
  };

  if (loading) return null;
  if (!latestPost && popularPosts.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Comunidad AgendaYa</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Lo último de nuestro Guía y las conversaciones más populares.</p>
          </div>
          <Link to="/blog" className="text-primary-600 dark:text-primary-400 font-bold hover:underline flex items-center gap-2">
            Ver todo el blog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Latest Post - Featured */}
          {latestPost && (
            <div className="lg:col-span-7">
              <Link to={`/blog/${latestPost.id}`} className="group block h-full">
                <div className="card h-full overflow-hidden flex flex-col hover:border-primary-400 transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <div className="relative h-64 sm:h-80 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {latestPost.image_url ? (
                      <img src={latestPost.image_url} alt={latestPost.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MessageSquare className="w-16 h-16 text-slate-400 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-1.5 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg">Nuevo</span>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(latestPost.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400"><User className="w-4 h-4" /> {latestPost.author_name}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-primary-600 transition-colors leading-tight">
                      {latestPost.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 line-clamp-3 text-lg leading-relaxed">
                      {latestPost.excerpt || latestPost.content.substring(0, 150) + '...'}
                    </p>
                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button onClick={(e) => handleLike(e, latestPost.id, 'post')} className="flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors">
                          <Heart className={`w-5 h-5 ${latestPost.likes_count > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span className="font-bold">{latestPost.likes_count}</span>
                        </button>
                        <div className="flex items-center gap-2 text-slate-500">
                          <MessageSquare className="w-5 h-5" />
                          <span className="font-bold">{latestPost.comment_count}</span>
                        </div>
                      </div>
                      <span className="font-black text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform flex items-center gap-2">
                        Leer más <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Popular Posts List */}
          <div className="lg:col-span-5 space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Conversaciones Populares</h4>
            {popularPosts.filter(p => p.id !== latestPost?.id).map((post) => (
              <Link key={post.id} to={`/blog/${post.id}`} className="group block">
                <div className="card p-5 hover:border-primary-400 transition-all duration-300 flex gap-5 shadow-sm hover:shadow-md">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2 mb-2 leading-tight">
                      {post.title}
                    </h5>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> {post.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comment_count}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogHomeSection;
