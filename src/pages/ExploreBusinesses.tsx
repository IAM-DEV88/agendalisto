import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, ArrowRight, Heart, Store, SlidersHorizontal, Search, X, Map, List, MessageCircle, Loader2 } from 'lucide-react';
import { getBusinesses, getBusinessCategories, getBusinessesMapData, toggleLike, checkLikedBusinesses } from '../lib/api';
import type { Business, BusinessCategory } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import EmptyState from '../components/ui/EmptyState';
import SelectMenu from '../components/ui/SelectMenu';
import ShareButton from '../components/ui/ShareButton';

const BusinessMap = lazy(() => import('../components/ui/BusinessMap'));

const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
const PAGE_SIZE = 12;

const BusinessCard = ({ business, categories, isLiked: initialLiked, currentUser, onToggleLike }: {
  business: Business;
  categories: BusinessCategory[];
  isLiked: boolean;
  currentUser: any;
  onToggleLike: (id: string) => void;
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(business.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) { toast.error('Debes iniciar sesión'); return; }
    try {
      setIsLiking(true);
      const result = await toggleLike(currentUser.id, business.id, 'business');
      if (result.success) {
        setIsLiked(result.action === 'added');
        setLikesCount(prev => result.action === 'added' ? prev + 1 : prev - 1);
        onToggleLike(business.id);
      }
    } catch { toast.error('Error al procesar'); } finally { setIsLiking(false); }
  };

  const cat = categories.find(c => c.id === business.category_id);

  return (
    <Link
      to={`/${business.slug}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      <div className="h-48 sm:h-52 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
        <img
          src={business.logo_url || FALLBACK_LOGO}
          alt={business.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = FALLBACK_LOGO; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <div className="flex gap-2">
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                isLiked ? 'bg-rose-500 text-white' : 'bg-white/20 hover:bg-white/40 text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <div onMouseDown={e => e.nativeEvent.stopImmediatePropagation()} onClick={e => { e.nativeEvent.stopImmediatePropagation(); e.stopPropagation(); }}>
              <ShareButton
                url={`${window.location.origin}/${business.slug}`}
                title={business.name}
                variant="icon"
                iconSize={16}
                className="!bg-white/20 !backdrop-blur-md hover:!bg-white/40 !text-white !rounded-xl"
              />
            </div>
            {business.whatsapp && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(`https://wa.me/${business.whatsapp}?text=${encodeURIComponent('Hola, vi tu perfil en AgendaYa y quiero agendar una cita')}`, '_blank', 'noopener,noreferrer');
                }}
                className="p-2 rounded-xl backdrop-blur-md bg-emerald-500/80 hover:bg-emerald-500 text-white transition-all"
                title="Hablar por WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {cat && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
            {cat.name}
          </span>
        )}
        {business.plan === 'premium' && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-100/90 dark:bg-amber-900/90 backdrop-blur-sm text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
            Premium
          </span>
        )}
        {business.plan === 'pro' && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-blue-100/90 dark:bg-blue-900/90 backdrop-blur-sm text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
            Pro
          </span>
        )}
        {(business as any).showcase_only && (
          <span className="absolute top-12 left-3 px-2 py-1 bg-amber-100/90 dark:bg-amber-900/90 backdrop-blur-sm text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
            Solo info
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
            {business.name}
          </h3>
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-bold text-xs flex-shrink-0">
            <Heart className={`h-3.5 w-3.5 ${likesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </div>
        </div>

        {business.address && (
          <div className="flex items-start text-slate-500 dark:text-slate-400 mb-2">
            <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-primary-500" />
            <p className="text-xs font-medium line-clamp-1">{business.address}</p>
          </div>
        )}

        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
          {business.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center text-primary-600 dark:text-primary-400 font-black text-xs group-hover:translate-x-1 transition-transform uppercase tracking-wider">
            Ver servicios
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
      </div>
    </div>
  );
}

const ExploreBusinesses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('location') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');

  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [mapBusinesses, setMapBusinesses] = useState<Pick<Business, 'id' | 'name' | 'slug' | 'lat' | 'lng'>[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const initialLoadRef = useRef(false);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (!node || !initialLoadRef.current) return;
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setPage(prev => prev + 1);
      }
    });
    observer.current.observe(node);
  }, [hasMore, loadingMore]);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setLocationTerm(searchParams.get('location') || '');
    setCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (locationTerm) params.set('location', locationTerm);
    if (category !== 'all') params.set('category', category);
    setSearchParams(params, { replace: true });
  }, [searchTerm, locationTerm, category, setSearchParams]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    getBusinessCategories().then(({ success, data }) => {
      if (success && data) setCategories(data);
    });
  }, []);

  // Reset on filter change
  useEffect(() => {
    setPage(0);
    setBusinesses([]);
    setHasMore(true);
    setLikedIds(new Set());
    fetchPage(0, true);
  }, [searchTerm, locationTerm, category]);

  // Load next page
  useEffect(() => {
    if (page > 0) {
      fetchPage(page, false);
    }
  }, [page]);

  const fetchPage = async (pageNum: number, isInitial: boolean) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const data = await getBusinesses(
        searchTerm || undefined,
        category !== 'all' ? category : undefined,
        locationTerm || undefined,
        PAGE_SIZE,
        pageNum * PAGE_SIZE,
      );
      setBusinesses(prev => isInitial ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);

      // Batch fetch likes for new businesses
      if (user && data.length > 0) {
        const ids = data.map(b => b.id);
        const liked = await checkLikedBusinesses(user.id, ids);
        setLikedIds(prev => new Set([...prev, ...liked]));
      }
    } catch {
      setError('Error al cargar los negocios. Intenta de nuevo.');
    } finally {
      if (isInitial) initialLoadRef.current = true;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load map data when switching to map view
  useEffect(() => {
    if (viewMode === 'map' && mapBusinesses.length === 0 && !mapLoading) {
      setMapLoading(true);
      getBusinessesMapData()
        .then(data => setMapBusinesses(data))
        .catch(() => {})
        .finally(() => setMapLoading(false));
    }
  }, [viewMode, mapBusinesses.length, mapLoading]);

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'Todas' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name })),
  ], [categories]);

  const hasFilters = searchTerm || locationTerm || category !== 'all';
  const clearFilters = () => { setSearchTerm(''); setLocationTerm(''); setCategory('all'); };
  const handleToggleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO
        title="Explora Negocios y Servicios"
        description="Encuentra los mejores negocios locales de barbería, belleza, salud y más. Filtra por categoría, ubicación y reserva online."
      />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary-200 dark:ring-primary-800">
            <Store className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Explora Negocios
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Encuentra servicios y reserva citas en los mejores negocios locales
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none p-4 sm:p-5 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="¿Qué servicio buscas?"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Ubicación"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="lg:w-48 relative">
              <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <SelectMenu
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />
            </div>
          </div>
          {hasFilters && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {businesses.length} {businesses.length === 1 ? 'resultado' : 'resultados'}
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-5 py-4 mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl animate-in fade-in duration-300">
            <span className="text-sm font-bold text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* View Toggle */}
        {!loading && businesses.length > 0 && (
          <div className="flex items-center justify-end mb-4 gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
              title="Vista lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
              title="Vista mapa"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        {loading && businesses.length === 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="No encontramos resultados"
              description="Intenta ajustar tus filtros o buscar con otros términos."
              action={hasFilters ? { label: 'Limpiar filtros', to: '/explore' } : undefined}
            />
          </div>
        ) : viewMode === 'map' ? (
          <div className="animate-in fade-in duration-300">
            {mapLoading ? (
              <div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : (
              <Suspense fallback={<div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                <BusinessMap businesses={mapBusinesses as any} />
              </Suspense>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {businesses.map((business) => (
                <div key={business.id}>
                  <BusinessCard
                    business={business}
                    categories={categories}
                    isLiked={likedIds.has(business.id)}
                    currentUser={user}
                    onToggleLike={handleToggleLike}
                  />
                </div>
              ))}
            </div>

            {/* Sentinel para infinite scroll — siempre visible si hay más páginas */}
            {hasMore && (
              <div ref={sentinelRef} className="h-4" />
            )}

            {loadingMore && (
              <div className="flex justify-center py-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  <span className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Cargando más...</span>
                </div>
              </div>
            )}

            {!hasMore && businesses.length > 0 && (
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

export default ExploreBusinesses;
