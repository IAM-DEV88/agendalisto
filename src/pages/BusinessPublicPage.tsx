import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getBusinessBySlug, getBusinessServices, getBusinessHours, getBusinessReviews, recordBusinessVisit, getReferralCounts, getBusinessCategories, BusinessCategory, Service, BusinessHours, Review, Business, toggleLike, checkIfLiked } from '../lib/api';
import { supabase } from '../lib/supabase';
import {
  ServicesList,
  BusinessHoursList,
  BusinessLocation,
  ReviewsSection
} from '../components/business/public';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import EmptyState from '../components/ui/EmptyState';
import ReferralBadge from '../components/ui/ReferralBadge';
import TabNav from '../components/ui/TabNav';
import type { Tab } from '../components/ui/TabNav';
import ConnectedPillCard from '../components/ui/ConnectedPillCard';
import { useStickyDetection } from '../hooks/useStickyDetection';
import ShareButton from '../components/ui/ShareButton';
import { toast } from 'react-hot-toast';
import { PLAN_BADGE } from '../lib/roles';
import { Store, Clock, MapPin, Star, Heart, Phone, Mail, MessageCircle, Globe, Instagram, Facebook, Pen, CreditCard, Landmark, DollarSign } from 'lucide-react';
import QRCode from 'qrcode';

function SkeletonHeader() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessPublicPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [activeInicioTab, setActiveInicioTab] = useState('about');
  const [activeServiciosTab, setActiveServiciosTab] = useState('vitrina');
  const [activeContactoTab, setActiveContactoTab] = useState('info');
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { ref: stickyRef, stuck: headerStuck } = useStickyDetection(65, !loading);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    getBusinessCategories().then(res => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    if (!slug) return;
    const publicUrl = `${window.location.origin}/${slug}`;
    QRCode.toDataURL(publicUrl, { width: 256, margin: 1, type: 'image/png' })
      .then(setQrDataUrl)
      .catch(() => {
        QRCode.toString(publicUrl, { type: 'svg' })
          .then((svg: string) => setQrDataUrl(`data:image/svg+xml,${encodeURIComponent(svg)}`))
          .catch(() => {
            setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`);
          });
      });
  }, [slug]);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!slug) { setError('URL inválida'); navigate('/'); return; }
      try {
        setLoading(true);
        const { success, business, error: businessError } = await getBusinessBySlug(slug);
        if (!success || !business) { setError(businessError || 'Negocio no encontrado'); return; }
        setBusinessData(business);
        recordBusinessVisit(business.id, user?.id);
        setLikesCount(business.likes_count || 0);

        // Parallelize independent data fetches after getting business
        const bid = business.id;
        const ownerId = business.owner_id;
        await Promise.allSettled([
          getBusinessServices(bid).then(({ success, data }) => {
            if (success && data) {
              setServices(data.filter(s => s.is_active !== false));
            }
          }),
          getBusinessHours(bid).then(hours => setBusinessHours(hours)).catch(err => {
            console.error('Error loading business hours:', err);
          }),
          getBusinessReviews(bid).then(({ success, data }) => {
            if (success && data) {
              setReviews(data);
              setAverageRating(data.length > 0 ? data.reduce((sum, r) => sum + r.rating, 0) / data.length : 0);
            }
          }).catch(err => { console.error('Error loading reviews:', err); }),
          ownerId ? getReferralCounts([ownerId]).then(counts => {
            setReferralCount(counts[ownerId] || 0);
          }) : Promise.resolve(),
        ]);
      } catch (err) { console.error('Error loading business:', err); setError('Error al cargar la información del negocio'); }
      finally { setLoading(false); }
    };
    fetchBusinessData();
  }, [slug, navigate]);

  useEffect(() => {
    if (user?.id && businessData?.id) {
      checkIfLiked(user.id, businessData.id, 'business').then(setIsLiked);
    }
  }, [user, businessData?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reschedule') === 'true') {
      const svcId = params.get('serviceId');
      if (svcId) navigate(`/${slug}/book/${svcId}`);
    }
  }, [location.search, navigate, slug]);

  const handleToggleLike = async () => {
    if (!businessData) return;
    if (!user) { toast.error('Debes iniciar sesión'); return; }
    try {
      setIsLiking(true);
      const result = await toggleLike(user.id, businessData.id, 'business');
      if (result.success) {
        setIsLiked(result.action === 'added');
        setLikesCount(prev => result.action === 'added' ? prev + 1 : prev - 1);
        toast.success(result.action === 'added' ? '¡Te gusta este negocio!' : 'Ya no te gusta este negocio');
      }
    } catch { toast.error('Error al procesar'); }
    finally { setIsLiking(false); }
  };

  const categoryName = useMemo(() => {
    if (!businessData?.category_id || categories.length === 0) return null;
    return categories.find(c => c.id === businessData.category_id)?.name || null;
  }, [businessData?.category_id, categories]);

  const priceRange = useMemo(() => {
    if (services.length === 0) return undefined;
    const prices = services.filter((s): s is Service & { price: number } => !!s.price);
    if (prices.length === 0) return undefined;
    const min = Math.min(...prices.map(s => s.price));
    const max = Math.max(...prices.map(s => s.price));
    return `$${min} - $${max}`;
  }, [services]);

  const businessSchema = businessData ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessData.name,
    "description": businessData.description,
    "image": businessData.logo_url,
    "address": { "@type": "PostalAddress", "streetAddress": businessData.address },
    "telephone": businessData.phone,
    "url": window.location.href,
    "priceRange": priceRange,
    "openingHoursSpecification": businessHours.length > 0 ? businessHours.map(h => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][h.day_of_week],
      "opens": !h.is_closed ? h.start_time : undefined,
      "closes": !h.is_closed ? h.end_time : undefined,
    })).filter(h => h.opens) : undefined,
    "aggregateRating": averageRating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": reviews.length,
      "bestRating": "5",
    } : undefined,
    "review": reviews.length > 0 ? reviews.slice(0, 5).map(r => ({
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": r.rating },
      "author": { "@type": "Person", "name": "Cliente" },
      "reviewBody": r.comment,
    })) : undefined,
    "makesOffer": services.map(s => ({
      "@type": "Offer",
      "name": s.name,
      "description": s.description,
      "price": s.price || undefined,
      "priceCurrency": "COP",
      "duration": `PT${s.duration}M`,
    })),
    "sameAs": [
      businessData.facebook ? `https://facebook.com/${businessData.facebook}` : undefined,
      businessData.instagram ? `https://instagram.com/${businessData.instagram}` : undefined,
      businessData.website || undefined,
    ].filter(Boolean),
  } : undefined;

  const tabs: Tab[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'servicios', label: 'Servicios', count: services.length },
    { id: 'contacto', label: 'Contacto' },
  ];

  const inicioTabs: Tab[] = [
    { id: 'about', label: 'Acerca de' },
    { id: 'hours', label: 'Horarios' },
    { id: 'reviews', label: 'Reseñas', count: reviews.length },
  ];

  const serviciosTabs: Tab[] = [
    { id: 'vitrina', label: 'Vitrina', count: services.length },
    { id: 'pagos', label: 'Pagos' },
  ];

  const contactoTabs: Tab[] = [
    { id: 'info', label: 'Contacto directo' },
    { id: 'ubicacion', label: 'Ubicación' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <SkeletonHeader />
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <SkeletonHeader /><SkeletonHeader />
            </div>
            <div className="space-y-4">
              <SkeletonHeader />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error || !businessData) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-20 px-4">
      <EmptyState
        icon={<Store className="w-10 h-10" />}
        title="Negocio no encontrado"
        description={error || 'El negocio que buscas no existe o ha sido eliminado.'}
        action={{ label: 'Volver al inicio', to: '/' }}
      />
    </div>
  );

  const ogImageUrl = `${window.location.origin}/.netlify/functions/og-image?type=business&name=${encodeURIComponent(businessData.name)}&slug=${slug}&rating=${averageRating}&logo=${encodeURIComponent(businessData.logo_url || '')}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      
      <SEO
        title={businessData.name}
        description={businessData.description}
        ogImage={businessData.logo_url || ogImageUrl}
        ogType="business.business"
        schemaData={businessSchema}
      />

      {/* ═══ BREADCRUMBS ═══ */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <Breadcrumbs crumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Explorar', href: '/explore' },
          { label: businessData.name },
        ]} />
      </div>

      {/* ═══ STICKY HEADER + TABS ═══ */}
      <div ref={stickyRef} className={`sticky top-16 z-30 transition-colors duration-150 ${
        headerStuck
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50 w-[100vw] ml-[calc(-50vw+50%)] pl-[calc(50vw-50%)] pr-[calc(50vw-50%)]'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="shrink-0">
              {businessData.logo_url ? (
                <div className="h-20 w-20 sm:h-20 sm:w-20 rounded-lg overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow">
                  <img src={businessData.logo_url} alt={`${businessData.name} logo`} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-20 w-20 sm:h-20 sm:w-20 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate mb-0">
                {businessData.name}
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Store className="w-3 h-3 shrink-0" />
                {categoryName || (businessData.description ? businessData.description.substring(0, 60) + (businessData.description.length > 60 ? '...' : '') : 'Perfil público')}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {businessData.plan && businessData.plan !== 'starter' && (
                  (() => {
                    const badge = PLAN_BADGE[businessData.plan as 'pro' | 'premium'];
                    return badge ? (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${badge.className}`}>
                        {badge.text}
                      </span>
                    ) : null;
                  })()
                )}
                {averageRating > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <Star className="w-2.5 h-2.5 fill-current" />{averageRating.toFixed(1)}
                  </span>
                )}
                {referralCount >= 3 && <ReferralBadge count={referralCount} size="sm" />}
              </div>
            </div>
          </div>
        </div>

        {/* ─── INTERACCIÓN (ultra compacta, sin fondo/borde) ─── */}
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleToggleLike} disabled={isLiking}
              aria-label={isLiked ? 'Quitar me gusta' : 'Me gusta'}
              aria-pressed={isLiked}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400'
              }`}>
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 ? likesCount : 'Me gusta'}
            </button>
            <ShareButton url={window.location.href} title={businessData.name} description={businessData.description || ''} variant="icon" iconSize={16} className="!bg-slate-100 dark:!bg-slate-800 !text-slate-600 dark:!text-slate-400 !rounded-lg !p-2 !min-h-[36px] !min-w-[36px]" />
            {businessData.whatsapp && (
              <a href={`https://wa.me/${businessData.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, vi tu perfil en AgendaYa y quiero agendar una cita')}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                aria-label="Contactar por WhatsApp">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {businessData.phone && (
              <a href={`tel:${businessData.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                aria-label="Llamar al negocio">
                <Phone className="w-3.5 h-3.5" /> Llamar
              </a>
            )}
            {businessData.website && (
              <a href={businessData.website.startsWith('http') ? businessData.website : `https://${businessData.website}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all min-h-[36px] min-w-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                aria-label="Sitio web">
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} sticky />
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-5 sm:space-y-6">
        <div ref={contentRef}>

          {/* ─── INICIO ─── */}
          {activeTab === 'inicio' && (
            <ConnectedPillCard tabs={inicioTabs} activeTabId={activeInicioTab} onTabChange={setActiveInicioTab}>
                <div className="animate-in fade-in zoom-in-95 duration-300">

                  {/* ── About ── */}
                  {activeInicioTab === 'about' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 rounded-lg">
                          <Store className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Acerca de</h3>
                        {user && user.id === businessData?.owner_id && (
                          <Link to="/business/dashboard?tab=settings&sub=profile" className="ml-auto p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Editar perfil">
                            <Pen className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>

                      {(() => {
                        const publicUrl = `${window.location.origin}/${slug}`;
                        return (
                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 min-w-0">
                              {businessData.description ? (
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{businessData.description}</p>
                              ) : (
                                <p className="text-sm text-slate-400 italic">Sin descripción disponible</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex justify-center sm:justify-end">
                              {qrDataUrl ? (
                                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm inline-flex">
                                <img
                                  src={qrDataUrl}
                                  alt={`QR ${businessData.name}`}
                                  loading="lazy"
                                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg max-w-full"
                                  onError={(e) => { console.error('QR image load error:', e); setQrDataUrl(null); }}
                                />
                                </div>
                              ) : (
                                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                                  <Store className="w-4 h-4" /> Ir al perfil
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {(businessData.facebook || businessData.instagram) && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Redes sociales</p>
                          <div className="flex flex-wrap gap-2">
                            {businessData.facebook && (
                              <a href={`https://facebook.com/${businessData.facebook}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                aria-label={`Facebook de ${businessData.name}`}>
                                <Facebook className="w-3.5 h-3.5" /> Facebook
                              </a>
                            )}
                            {businessData.instagram && (
                              <a href={`https://instagram.com/${businessData.instagram}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                aria-label={`Instagram de ${businessData.name}`}>
                                <Instagram className="w-3.5 h-3.5" /> Instagram
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Hours ── */}
                  {activeInicioTab === 'hours' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Horarios</h3>
                        {user && user.id === businessData?.owner_id && (
                          <Link to="/business/dashboard?tab=hours" className="ml-auto p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Editar horarios">
                            <Pen className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                      <BusinessHoursList businessHours={businessHours} />
                    </div>
                  )}

                  {/* ── Reviews ── */}
                  {activeInicioTab === 'reviews' && (
                    <ReviewsSection businessId={businessData.id} plain />
                  )}
                </div>

              {/* ── Sidebar banners ── */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessData?.showcase_only && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-5 border border-amber-200 dark:border-amber-800/50">
                    <p className="font-bold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2"><Store className="w-4 h-4" /> Escaparate informativo</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-2">Este negocio solo muestra su información. Contáctalos directamente.</p>
                  </div>
                )}
                {!user && (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800 p-5 text-center">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-400"><Link to="/login" className="underline decoration-amber-500/50 hover:text-amber-600 transition-colors">Inicia sesión</Link> para reservar servicios.</p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800 p-5 text-center">
                      <p className="text-sm font-bold text-primary-800 dark:text-primary-300">🌐 ¿Tienes un negocio como este? <Link to="/register" className="underline decoration-primary-500/50 hover:text-primary-600 transition-colors">Crea tu web gratis</Link></p>
                    </div>
                  </>
                )}
               </div>
            </ConnectedPillCard>
          )}

          {/* ─── SERVICIOS ─── */}
          {activeTab === 'servicios' && (
            <ConnectedPillCard tabs={serviciosTabs} activeTabId={activeServiciosTab} onTabChange={setActiveServiciosTab}>
                <div className="animate-in fade-in zoom-in-95 duration-300">

                  {/* ── Vitrina ── */}
                  {activeServiciosTab === 'vitrina' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 rounded-lg">
                          <Store className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Servicios Disponibles</h3>
                        {user && user.id === businessData?.owner_id && (
                          <Link to="/business/dashboard?tab=services" className="ml-auto p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Gestionar servicios">
                            <Pen className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                      <ServicesList services={services} currentUser={user} showcaseOnly={!!businessData?.showcase_only} />
                    </div>
                  )}

                  {/* ── Pagos ── */}
                  {activeServiciosTab === 'pagos' && (
                    <div className="space-y-5" role="region" aria-labelledby="payment-methods-heading">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg">
                          <Store className="w-5 h-5" />
                        </div>
                        <h3 id="payment-methods-heading" className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Métodos de Pago</h3>
                        {user && user.id === businessData?.owner_id && (
                          <Link to="/business/dashboard?tab=settings&sub=config" className="ml-auto p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Configurar pagos">
                            <Pen className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {services.filter(s => s.requires_payment).length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Servicios con pago</p>
                            <div className="space-y-2">
                              {services.filter(s => s.requires_payment).map(s => (
                                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700">
                                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10">
                                    <DollarSign className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Servicio</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                                  </div>
                                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{s.payment_percentage}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Aceptamos</p>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const methods = businessData.config?.payment_methods;
                              if (!methods) return <span className="text-xs text-slate-400 italic">No hay métodos de pago configurados</span>;
                              const enabledMethods = Object.entries(methods)
                                .filter(([, cfg]) => cfg.enabled)
                                .map(([key]) => key);
                              if (enabledMethods.length === 0) return <span className="text-xs text-slate-400 italic">Próximamente — Consulta con el negocio</span>;
                              const methodStyles: Record<string, string> = {
                                paypal: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40',
                                wompi: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40',
                              };
                              const methodLabels: Record<string, string> = {
                                paypal: 'PayPal',
                                wompi: 'Wompi',
                              };
                              const methodIcons: Record<string, React.ReactNode> = {
                                paypal: <CreditCard className="w-3.5 h-3.5" />,
                                wompi: <Landmark className="w-3.5 h-3.5" />,
                              };
                              return enabledMethods.map(m => (
                                <span key={m} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${methodStyles[m] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                  aria-label={`Acepta pagos con ${methodLabels[m] || m.charAt(0).toUpperCase() + m.slice(1)}`}>
                                  {methodIcons[m]}
                                  {methodLabels[m] || m.charAt(0).toUpperCase() + m.slice(1)}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                        Los pagos se procesan de forma segura a través de nuestros proveedores. No almacenamos información de tarjetas.
                      </p>
                    </div>
                  )}
                </div>
            </ConnectedPillCard>
          )}

          {/* ─── CONTACTO ─── */}
          {activeTab === 'contacto' && (
            <ConnectedPillCard tabs={contactoTabs} activeTabId={activeContactoTab} onTabChange={setActiveContactoTab}>
                <div className="animate-in fade-in zoom-in-95 duration-300">

                  {/* ── Contacto directo ── */}
                  {activeContactoTab === 'info' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 rounded-lg">
                          <Phone className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Información de contacto</h3>
                        {user && user.id === businessData?.owner_id && (
                          <Link to="/business/dashboard?tab=settings&sub=profile" className="ml-auto p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Editar información de contacto">
                            <Pen className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>

                      <div className="space-y-3">
                        {businessData.phone && (
                          <a href={`tel:${businessData.phone}`} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700">
                            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10"><Phone className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
                            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono</p><p className="text-sm font-bold text-slate-900 dark:text-white">{businessData.phone}</p></div>
                          </a>
                        )}
                        {businessData.whatsapp && (
                          <a href={`https://wa.me/${businessData.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, vi tu perfil en AgendaYa y quiero agendar una cita')}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-200 dark:border-emerald-800">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20"><MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                            <div><p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">WhatsApp</p><p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{businessData.whatsapp}</p></div>
                          </a>
                        )}
                        {businessData.email && (
                          <a href={`mailto:${businessData.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700">
                            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10"><Mail className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
                            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p><p className="text-sm font-bold text-slate-900 dark:text-white">{businessData.email}</p></div>
                          </a>
                        )}
                      </div>

                      {(businessData.facebook || businessData.instagram || businessData.website) && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Redes sociales</p>
                          <div className="flex flex-wrap gap-2">
                            {businessData.facebook && (
                              <a href={`https://facebook.com/${businessData.facebook}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                aria-label={`Facebook de ${businessData.name}`}>
                                <Facebook className="w-3.5 h-3.5" /> Facebook
                              </a>
                            )}
                            {businessData.instagram && (
                              <a href={`https://instagram.com/${businessData.instagram}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                aria-label={`Instagram de ${businessData.name}`}>
                                <Instagram className="w-3.5 h-3.5" /> Instagram
                              </a>
                            )}
                            {businessData.website && (
                              <a href={businessData.website.startsWith('http') ? businessData.website : `https://${businessData.website}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                aria-label="Sitio web">
                                <Globe className="w-3.5 h-3.5" /> Sitio web
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Ubicación ── */}
                  {activeContactoTab === 'ubicacion' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 rounded-lg">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Ubicación</h3>
                        {user && user.id === businessData?.owner_id && (
                          <Link to="/business/dashboard?tab=settings&sub=profile" className="ml-auto p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Editar ubicación">
                            <Pen className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                      {businessData.config?.mostrar_direccion !== false && <BusinessLocation address={businessData.address} lat={businessData.lat} lng={businessData.lng} />}
                    </div>
                  )}
                </div>
            </ConnectedPillCard>
          )}

        </div>
      </div>
    </div>
  );
}

export default BusinessPublicPage;
