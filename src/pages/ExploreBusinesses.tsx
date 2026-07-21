import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Heart, Store, Search, X, Map, List, MessageCircle, Loader2, SlidersHorizontal, Sparkles, Crown, UserPlus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getBusinesses, getBusinessCategories, toggleLike, checkLikedBusinesses, getReferralCounts } from '../lib/api';
import type { Business, BusinessCategory } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';
import EmptyState from '../components/ui/EmptyState';
import SelectMenu from '../components/ui/SelectMenu';
import ShareButton from '../components/ui/ShareButton';
import ReferralBadge from '../components/ui/ReferralBadge';
import { FALLBACK_BUSINESS_LOGO } from '../lib/config';
import { useDominantColor } from '../hooks/useDominantColor';
import type { RootState } from '../store';

const BusinessMap = lazy(() => import('../components/ui/BusinessMap'));
const PAGE_SIZE = 12;

const BusinessCard = memo(({ business, categories, isLiked: initialLiked, currentUser, onToggleLike, referralCount }: {
  business: Business;
  categories: BusinessCategory[];
  isLiked: boolean;
  currentUser: import('../lib/supabase').UserProfile | null;
  onToggleLike: (id: string) => void;
  referralCount?: number;
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(business.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setLikesCount(business.likes_count || 0);
  }, [business.likes_count]);

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
        toast.success(result.action === 'added' ? '¡Te gusta este negocio!' : 'Ya no te gusta este negocio');
      }
    } catch { toast.error('Error al procesar'); } finally { setIsLiking(false); }
  };

  const cat = categories.find(c => c.id === business.category_id);
  const shareUrl = `${window.location.origin}/${business.slug}`;
  const dominantColor = useDominantColor(business.logo_url);

  return (
    <Link
      to={`/${business.slug}`}
      className="group relative flex items-stretch rounded-lg border transition-all cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 min-h-[88px]"
    >
      {/* Logo/Thumbnail */}
      <div
        className="relative w-20 sm:w-24 shrink-0 overflow-hidden rounded-l-lg"
        style={{ background: dominantColor }}
      >
        <img
          src={business.logo_url || FALLBACK_BUSINESS_LOGO}
          alt={business.name}
          loading="lazy"
          width={96}
          height={96}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = FALLBACK_BUSINESS_LOGO; }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {business.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            {cat && (
              <span className="px-1.5 py-[1px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px] font-bold uppercase leading-tight">
                {cat.name}
              </span>
            )}
            {business.plan === 'premium' && (
              <span className="inline-flex items-center gap-0.5 px-2 py-[2px] bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-amber-700 dark:text-amber-300 rounded text-[10px] font-black uppercase leading-tight tracking-wide shadow-sm">
                <Crown className="w-2.5 h-2.5" />
                Premium
              </span>
            )}
            {business.plan === 'pro' && (
              <span className="inline-flex items-center gap-0.5 px-2 py-[2px] bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-black uppercase leading-tight tracking-wide shadow-sm">
                <Sparkles className="w-2.5 h-2.5" />
                Pro
              </span>
            )}
          </div>
          {business.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
              {business.description}
            </p>
          )}
        </div>

        {business.address && (
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <p className="text-[10px] font-medium text-slate-500 truncate">{business.address}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          {referralCount !== undefined && referralCount >= 3 && (
            <ReferralBadge count={referralCount} size="sm" />
          )}

          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            aria-label={isLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            aria-pressed={isLiked}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'
            }`}
          >
            <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-current' : ''}`} />
            {likesCount > 0 && likesCount}
          </button>

          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex-shrink-0">
            <ShareButton
              url={shareUrl}
              title={business.name}
              variant="text"
              iconSize={11}
              className="p-0.5 bg-transparent hover:bg-transparent text-slate-500 hover:text-primary-500 !rounded !gap-1"
            />
          </div>

          {business.whatsapp && (
            <button
              aria-label="Contactar por WhatsApp"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`https://wa.me/${business.whatsapp}?text=${encodeURIComponent('Hola, vi tu perfil en AgendaYa y quiero agendar una cita')}`, '_blank', 'noopener,noreferrer');
              }}
              className="text-slate-500 hover:text-emerald-500 transition-colors p-0.5"
            >
              <MessageCircle className="w-2.5 h-2.5" />
            </button>
          )}

          <div className="ml-auto">
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver <Store className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse flex min-h-[88px]">
      <div className="w-20 sm:w-24 bg-slate-200 dark:bg-slate-800" />
      <div className="flex-1 p-3 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
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

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedLocation, setDebouncedLocation] = useState(locationTerm);

  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [referralCounts, setReferralCounts] = useState<Record<string, number>>({});
  const [mapBusinesses, setMapBusinesses] = useState<Business[]>([]);
  const [dismissedCta, setDismissedCta] = useState(() => sessionStorage.getItem('agendaya_explore_cta_dismissed') === 'true');

  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const myBusinesses = useSelector((state: RootState) => state.user.businesses);
  const isVisitorOrClient = userProfile && (userProfile.role === 'visitor' || userProfile.role === 'client');
  const hasBusiness = myBusinesses.length > 0;
  const showRegisterCta = userProfile && isVisitorOrClient && !hasBusiness && !dismissedCta;

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
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocation(locationTerm), 350);
    return () => clearTimeout(timer);
  }, [locationTerm]);

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

  useEffect(() => {
    setPage(0);
    setBusinesses([]);
    setHasMore(true);
    setLikedIds(new Set());
    fetchPage(0, true);
  }, [debouncedSearch, debouncedLocation, category]);

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
        debouncedSearch || undefined,
        category !== 'all' ? category : undefined,
        debouncedLocation || undefined,
        PAGE_SIZE,
        pageNum * PAGE_SIZE,
      );
      setBusinesses(prev => isInitial ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);

      // Parallelize liked check and referral counts
      const parallelPromises: Promise<void>[] = [];

      if (user && data.length > 0) {
        parallelPromises.push(
          checkLikedBusinesses(user.id, data.map(b => b.id))
            .then(liked => setLikedIds(prev => new Set([...prev, ...liked])))
        );
      }

      const ownerIds = data.map(b => b.owner_id).filter(Boolean);
      if (ownerIds.length > 0) {
        parallelPromises.push(
          getReferralCounts(ownerIds)
            .then(counts => setReferralCounts(prev => ({ ...prev, ...counts })))
        );
      }

      await Promise.all(parallelPromises);
    } catch {
      setError('Error al cargar los negocios. Intenta de nuevo.');
    } finally {
      if (isInitial) initialLoadRef.current = true;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'map') {
      setMapBusinesses(businesses);
    }
  }, [viewMode, businesses]);

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'Todas' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name })),
  ], [categories]);

  const hasFilters = searchTerm || locationTerm || category !== 'all';
  const clearFilters = () => { setSearchTerm(''); setLocationTerm(''); setCategory('all'); };
  const handleToggleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO
        title="Explora Negocios y Servicios"
        description="Encuentra los mejores negocios locales de barbería, belleza, salud y más. Filtra por categoría, ubicación y reserva online."
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 sm:space-y-5">

        {/* ═══ HEADER (dashboard style) ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                Explora Negocios
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Encuentra servicios y reserva citas
              </p>
            </div>
          </div>
        </div>

        {/* ═══ FILTERS (compact) ═══ */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="¿Qué servicio buscas?"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-xs font-medium min-h-[36px]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="Ubicación"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-xs font-medium min-h-[36px]"
              />
              {locationTerm && (
                <button onClick={() => setLocationTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="relative min-w-[130px]">
              <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
              <SelectMenu
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all min-h-[36px]"
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                title="Vista lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] ${viewMode === 'map' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                title="Vista mapa"
              >
                <Map className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {hasFilters && businesses.length > 0 && (
            <p className="text-[11px] font-medium text-slate-500 mt-1.5">
              {businesses.length} {businesses.length === 1 ? 'resultado' : 'resultados'}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in duration-300">
            <span className="text-xs font-bold text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Content */}
        {loading && businesses.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="animate-in fade-in zoom-in-95 duration-300 pt-8">
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="No encontramos resultados"
              description="Intenta ajustar tus filtros o buscar con otros términos."
              action={hasFilters ? { label: 'Limpiar filtros', to: '/explore' } : undefined}
            />
            {!hasFilters && (
              <div className="mt-6 text-center animate-in fade-in zoom-in-95 duration-500 delay-200">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-bold text-sm rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all"
                >
                  🌐 ¿Tienes un negocio? Crea tu web gratis y aparece aquí →
                </Link>
              </div>
            )}
          </div>
        ) : viewMode === 'map' ? (
          <Suspense fallback={<div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
            <BusinessMap businesses={mapBusinesses as any} />
          </Suspense>
        ) : (
          <>
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  categories={categories}
                  isLiked={likedIds.has(business.id)}
                  currentUser={user}
                  onToggleLike={handleToggleLike}
                  referralCount={referralCounts[business.owner_id]}
                />
              ))}
            </div>

            {hasMore && <div ref={sentinelRef} className="h-4" />}

            {loadingMore && (
              <div className="flex justify-center py-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cargando más...</span>
                </div>
              </div>
            )}

            {!hasMore && businesses.length > 0 && (
              <div className="text-center py-8 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Has llegado al final</span>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ STICKY CTA: REGISTRAR NEGOCIO ═══ */}
        {showRegisterCta && (
          <div className="sticky bottom-0 z-40 -mx-4 px-4 pb-4 pt-2 mt-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-xl shadow-2xl shadow-primary-500/30 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="hidden sm:flex w-10 h-10 rounded-lg bg-white/20 items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-black text-white tracking-tight">
                    ¿Tienes un negocio? <span className="text-primary-200">Regístralo gratis</span>
                  </p>
                  <p className="text-xs sm:text-sm text-primary-200/80 font-medium mt-0.5">
                    Llega a más clientes, recibe reservas online y haz crecer tu negocio.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <Link
                    to="/business/register"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white text-primary-700 text-xs sm:text-sm font-black rounded-lg hover:bg-primary-50 active:scale-95 transition-all shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    Registrar gratis
                  </Link>
                  <button
                    onClick={() => { setDismissedCta(true); sessionStorage.setItem('agendaya_explore_cta_dismissed', 'true'); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreBusinesses;
