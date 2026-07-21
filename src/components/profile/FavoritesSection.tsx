import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Trash2, Store, Scissors, FileText, Clock, DollarSign } from 'lucide-react';
import { getUserFavorites, toggleLike, getUserFavoriteServices, getUserFavoriteBlogPosts, toggleBlogLike } from '../../lib/api';
import type { FavoriteItem, ServiceFavoriteItem, BlogPostFavoriteItem } from '../../lib/api';
import type { UserProfile } from '../../lib/supabase';
import { TabNav } from '../ui/TabNav';
import SectionHeader from '../ui/SectionHeader';
import EmptyState from '../ui/EmptyState';
import { notifySuccess, notifyError } from '../../lib/toast';
import { FALLBACK_BUSINESS_LOGO, FALLBACK_BLOG_IMG } from '../../lib/config';

const FAVORITE_TABS = [
  { id: 'businesses', label: 'Negocios' },
  { id: 'services', label: 'Servicios' },
  { id: 'posts', label: 'Publicaciones' },
];

interface FavoritesSectionProps {
  user: UserProfile;
}

export default function FavoritesSection({ user }: FavoritesSectionProps) {
  const [activeTab, setActiveTab] = useState('businesses');
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <SectionHeader
          title="Mis Favoritos"
          description="Negocios, servicios y publicaciones que has guardado"
        />
      </div>
      <TabNav tabs={FAVORITE_TABS} activeTabId={activeTab} onTabChange={setActiveTab} variant="pill" sticky connected />

      <div className="bg-white dark:bg-slate-900 rounded-b-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6 -mt-px">
        <div className="animate-in fade-in zoom-in-95 duration-300">
          {activeTab === 'businesses' && <BusinessFavorites userId={user.id} />}
          {activeTab === 'services' && <ServiceFavorites userId={user.id} />}
          {activeTab === 'posts' && <BlogFavorites userId={user.id} />}
        </div>
      </div>
    </div>
  );
}

// ─── Negocios ───

function BusinessFavorites({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getUserFavorites(userId);
      if (res.success) setFavorites(res.data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleRemove = useCallback(async (fav: FavoriteItem) => {
    setRemovingId(fav.like_id);
    const res = await toggleLike(userId, fav.business_id, 'business');
    if (res.success) {
      setFavorites(prev => prev.filter(f => f.like_id !== fav.like_id));
      notifySuccess(`${fav.name} eliminado de favoritos`);
    } else {
      notifyError('Error al eliminar de favoritos');
    }
    setRemovingId(null);
  }, [userId]);

  if (loading) return <SkeletonGrid count={3} />;
  if (favorites.length === 0) return (
    <EmptyState
      icon={<Store className="w-8 h-8" />}
      title="Sin negocios favoritos"
      description="Los negocios que te gusten aparecerán aquí."
      action={{ label: 'Explorar negocios', to: '/explore' }}
    />
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {favorites.map((fav, index) => (
        <FavoriteBusinessCard key={fav.like_id} fav={fav} index={index} removingId={removingId} onRemove={handleRemove} />
      ))}
    </div>
  );
}

function FavoriteBusinessCard({ fav, index, removingId, onRemove }: { fav: FavoriteItem; index: number; removingId: string | null; onRemove: (fav: FavoriteItem) => void }) {
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <Link to={`/${fav.slug}`} className="flex flex-col flex-1">
        <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
          <span className="absolute top-3 right-3 w-6 h-6 rounded-md bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-[10px] font-black text-white z-10">
            {index + 1}
          </span>
          <img
            src={fav.logo_url || FALLBACK_BUSINESS_LOGO}
            alt={fav.name}
            width={160}
            height={160}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = FALLBACK_BUSINESS_LOGO; }}
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
            Favorito
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1 mb-1">
            {fav.name}
          </h3>

          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-bold text-xs mb-2">
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            <span>{fav.likes_count}</span>
          </div>

          {fav.address && (
            <div className="flex items-start text-slate-500 dark:text-slate-400 mb-2">
              <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-primary-500" />
              <p className="text-xs font-medium line-clamp-1">{fav.address}</p>
            </div>
          )}

          {fav.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 flex-1 leading-relaxed">
              {fav.description}
            </p>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={() => onRemove(fav)}
          disabled={removingId === fav.like_id}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {removingId === fav.like_id ? 'Eliminando...' : 'Eliminar de favoritos'}
        </button>
      </div>
    </div>
  );
}

// ─── Servicios ───

function ServiceFavorites({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<ServiceFavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getUserFavoriteServices(userId);
      if (res.success) setFavorites(res.data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleRemove = useCallback(async (fav: ServiceFavoriteItem) => {
    setRemovingId(fav.like_id);
    const res = await toggleLike(userId, fav.service_id, 'service');
    if (res.success) {
      setFavorites(prev => prev.filter(f => f.like_id !== fav.like_id));
      notifySuccess(`${fav.name} eliminado de favoritos`);
    } else {
      notifyError('Error al eliminar de favoritos');
    }
    setRemovingId(null);
  }, [userId]);

  if (loading) return <SkeletonGrid count={3} />;
  if (favorites.length === 0) return (
    <EmptyState
      icon={<Scissors className="w-8 h-8" />}
      title="Sin servicios favoritos"
      description="Los servicios que te gusten aparecerán aquí."
      action={{ label: 'Explorar servicios', to: '/explore' }}
    />
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {favorites.map((fav, index) => (
        <FavoriteServiceCard key={fav.like_id} fav={fav} index={index} removingId={removingId} onRemove={handleRemove} />
      ))}
    </div>
  );
}

function FavoriteServiceCard({ fav, index, removingId, onRemove }: { fav: ServiceFavoriteItem; index: number; removingId: string | null; onRemove: (fav: ServiceFavoriteItem) => void }) {
  const previewImage = fav.image_urls?.[0] || FALLBACK_BUSINESS_LOGO;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <Link to={`/${fav.business_slug}/book/${fav.service_id}`} className="flex flex-col flex-1">
        <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
          <span className="absolute top-3 right-3 w-6 h-6 rounded-md bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-[10px] font-black text-white z-10">
            {index + 1}
          </span>
          <img
            src={previewImage}
            alt={fav.name}
            width={160}
            height={160}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = FALLBACK_BUSINESS_LOGO; }}
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
            {fav.business_name}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1 mb-2">
            {fav.name}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-1 leading-relaxed">
            {fav.description}
          </p>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${fav.price.toLocaleString('es-CO')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {fav.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              {fav.likes_count}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={() => onRemove(fav)}
          disabled={removingId === fav.like_id}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {removingId === fav.like_id ? 'Eliminando...' : 'Eliminar de favoritos'}
        </button>
      </div>
    </div>
  );
}

// ─── Publicaciones ───

function BlogFavorites({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<BlogPostFavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getUserFavoriteBlogPosts(userId);
      if (res.success) setFavorites(res.data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleRemove = useCallback(async (fav: BlogPostFavoriteItem) => {
    setRemovingId(fav.like_id);
    const res = await toggleBlogLike(userId, fav.post_id, 'post');
    if (res.success) {
      setFavorites(prev => prev.filter(f => f.like_id !== fav.like_id));
      notifySuccess(`${fav.title} eliminado de favoritos`);
    } else {
      notifyError('Error al eliminar de favoritos');
    }
    setRemovingId(null);
  }, [userId]);

  if (loading) return <SkeletonGrid count={3} />;
  if (favorites.length === 0) return (
    <EmptyState
      icon={<FileText className="w-8 h-8" />}
      title="Sin publicaciones favoritas"
      description="Los artículos del blog que te gusten aparecerán aquí."
      action={{ label: 'Leer blog', to: '/blog' }}
    />
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {favorites.map((fav, index) => (
        <FavoriteBlogCard key={fav.like_id} fav={fav} index={index} removingId={removingId} onRemove={handleRemove} />
      ))}
    </div>
  );
}

function FavoriteBlogCard({ fav, index, removingId, onRemove }: { fav: BlogPostFavoriteItem; index: number; removingId: string | null; onRemove: (fav: BlogPostFavoriteItem) => void }) {
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <Link to={`/blog/${fav.post_id}`} className="flex flex-col flex-1">
        <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
          <span className="absolute top-3 right-3 w-6 h-6 rounded-md bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-[10px] font-black text-white z-10">
            {index + 1}
          </span>
          <img
            src={fav.image_url || FALLBACK_BLOG_IMG}
            alt={fav.title}
            width={160}
            height={160}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = FALLBACK_BLOG_IMG; }}
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
            Artículo
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
            {fav.title}
          </h3>

          {fav.excerpt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3 flex-1 leading-relaxed">
              {fav.excerpt}
            </p>
          )}

          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-bold text-xs">
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            <span>{fav.likes_count}</span>
            {fav.created_at && (
              <span className="ml-auto">
                {new Date(fav.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={() => onRemove(fav)}
          disabled={removingId === fav.like_id}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {removingId === fav.like_id ? 'Eliminando...' : 'Eliminar de favoritos'}
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ───

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 animate-pulse">
          <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2" />
        </div>
      ))}
    </div>
  );
}
