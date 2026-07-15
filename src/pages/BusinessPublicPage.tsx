import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getBusinessBySlug, getBusinessServices, getBusinessHours, getBusinessReviews, recordBusinessVisit, getReferralCounts, Service, BusinessHours, Review, Business } from '../lib/api';
import { supabase } from '../lib/supabase';
import {
  BusinessHeader,
  ServicesList,
  BusinessHoursList,
  BusinessLocation,
  ReviewsSection
} from '../components/business/public';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import EmptyState from '../components/ui/EmptyState';
import ReferralBadge from '../components/ui/ReferralBadge';
import { Store, Clock, MapPin } from 'lucide-react';

function SkeletonHeader() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-48 md:h-72 bg-slate-200 dark:bg-slate-800" />
      <div className="p-6 md:p-10 space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-96" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse space-y-3">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
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
  const [activeTab, setActiveTab] = useState('services');
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [referralCount, setReferralCount] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!slug) { setError('URL inválida'); navigate('/'); return; }
      try {
        setLoading(true);
        const { success, business, error: businessError } = await getBusinessBySlug(slug);
        if (!success || !business) { setError(businessError || 'Negocio no encontrado'); return; }
        setBusinessData(business);
        recordBusinessVisit(business.id, user?.id);

        const { success: sS, data: sD } = await getBusinessServices(business.id);
        if (sS && sD) {
          const active = sD.filter(s => s.is_active !== false);
          setServices(active);
        }

        try { setBusinessHours(await getBusinessHours(business.id)); } catch (err) {
          console.error('Error loading business hours:', err);
        }

        try {
          const { success: rS, data: rD } = await getBusinessReviews(business.id);
          if (rS && rD) {
            setReviews(rD);
            setAverageRating(rD.length > 0 ? rD.reduce((sum, r) => sum + r.rating, 0) / rD.length : 0);
          }
        } catch (err) { console.error('Error loading reviews:', err); }

        // Fetch referral badge
        if (business.owner_id) {
          const counts = await getReferralCounts([business.owner_id]);
          setReferralCount(counts[business.owner_id] || 0);
        }
      } catch (err) { console.error('Error loading business:', err); setError('Error al cargar la información del negocio'); }
      finally { setLoading(false); }
    };
    fetchBusinessData();
  }, [slug, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reschedule') === 'true') {
      const svcId = params.get('serviceId');
      if (svcId) navigate(`/${slug}/book/${svcId}`);
    }
  }, [location.search, navigate, slug]);

  const businessSchema = businessData ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessData.name,
    "description": businessData.description,
    "image": businessData.logo_url,
    "address": { "@type": "PostalAddress", "streetAddress": businessData.address },
    "telephone": businessData.phone,
    "url": window.location.href,
    "priceRange": services.length > 0 ? `$${Math.min(...services.filter(s => s.price).map(s => s.price!))} - $${Math.max(...services.filter(s => s.price).map(s => s.price!))}` : undefined,
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        <SkeletonHeader />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <SkeletonCard /><SkeletonCard />
          </div>
          <div className="space-y-6">
            <SkeletonCard /><SkeletonCard />
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">

        {/* Breadcrumbs */}
        <Breadcrumbs crumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Explorar', href: '/explore' },
          { label: businessData.name },
        ]} />

        {/* Business Header */}
        <BusinessHeader businessData={businessData} averageRating={averageRating} reviewsCount={reviews.length} />

        {/* Referral badge */}
        {referralCount >= 3 && (
          <div className="mt-4 flex justify-start">
            <ReferralBadge count={referralCount} size="md" />
          </div>
        )}

        {/* Showcase Banner */}
        {businessData?.showcase_only && (
          <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-800 dark:text-amber-300">Escaparate informativo</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                Este negocio solo muestra su información por ahora. Para contratar sus servicios, contáctalos directamente por los medios disponibles.
              </p>
            </div>
          </div>
        )}

        {/* Content — responsive: single layout, mobile tabs, desktop grid */}
        <div className="mt-8">
          {/* Mobile tab navigation */}
          <div className="md:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {[
                ...(!businessData?.showcase_only ? [{ id: 'services', label: 'Servicios' }] : []),
                { id: 'hours', label: 'Horarios' },
                { id: 'location', label: 'Ubicación' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 text-center text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-white dark:bg-slate-900'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid layout */}
          <div className={`md:grid md:gap-8 ${businessData?.showcase_only ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {/* Main column */}
            {!businessData?.showcase_only && (
            <div className="md:col-span-2 space-y-8">
              {/* Services — always on desktop, tab-controlled on mobile */}
              <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 ${activeTab !== 'services' ? 'hidden' : ''} md:block`}>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Servicios Disponibles</h2>
                <ServicesList
                  services={services}
                  currentUser={user}
                  businessOwnerId={businessData?.owner_id}
                  showcaseOnly={!!businessData?.showcase_only}
                />
                {user && user.id === businessData?.owner_id && (
                  <Link to="/business/dashboard?tab=services" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all md:w-auto w-full justify-center">
                    Gestionar Servicios
                  </Link>
                )}
              </div>

              {/* Reviews — always visible on desktop, hidden on mobile (no tab for this) */}
              <div className="hidden md:block">
                <ReviewsSection businessId={businessData.id} />
              </div>
            </div>
            )}

            {/* Sidebar or showcase grid items */}
            {businessData?.showcase_only ? (
              <>
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${activeTab !== 'hours' ? 'hidden' : ''} md:block`}>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    Horarios
                  </h2>
                  <BusinessHoursList businessHours={businessHours} />
                  {user && user.id === businessData?.owner_id && (
                    <Link to="/business/dashboard?tab=availability" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                      Editar Horarios
                    </Link>
                  )}
                </div>
                {businessData?.config?.mostrar_direccion && (
                  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${activeTab !== 'location' ? 'hidden' : ''} md:block`}>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      Ubicación
                    </h2>
                    <BusinessLocation address={businessData.address} lat={businessData.lat} lng={businessData.lng} />
                    {user && user.id === businessData?.owner_id && (
                      <Link to="/business/dashboard?tab=profile" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                        Editar Perfil
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
            <div className="space-y-6 mt-8 md:mt-0">
              {/* Hours */}
              <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${activeTab !== 'hours' ? 'hidden' : ''} md:block`}>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  Horarios
                </h2>
                <BusinessHoursList businessHours={businessHours} />
                {user && user.id === businessData?.owner_id && (
                  <Link to="/business/dashboard?tab=availability" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                    Editar Horarios
                  </Link>
                )}
              </div>

              {/* Location */}
              {businessData?.config?.mostrar_direccion && (
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${activeTab !== 'location' ? 'hidden' : ''} md:block`}>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    Ubicación
                  </h2>
                  <BusinessLocation address={businessData.address} lat={businessData.lat} lng={businessData.lng} />
                  {user && user.id === businessData?.owner_id && (
                    <Link to="/business/dashboard?tab=profile" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                      Editar Perfil
                    </Link>
                  )}
                </div>
              )}

              {!user && (
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 text-center">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                      <Link to="/login" className="underline decoration-amber-500/50 hover:text-amber-600 transition-colors">Inicia sesión</Link> para reservar servicios.
                    </p>
                  </div>
                  <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-200 dark:border-primary-800 p-5 text-center">
                    <p className="text-sm font-bold text-primary-800 dark:text-primary-300">
                      🌐 ¿Tienes un negocio como este?{' '}
                      <Link to="/register" className="underline decoration-primary-500/50 hover:text-primary-600 transition-colors">
                        Crea tu web gratis
                      </Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessPublicPage;
