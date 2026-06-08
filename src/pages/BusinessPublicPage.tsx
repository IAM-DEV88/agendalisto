import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getBusinessBySlug, getBusinessServices, getBusinessHours, getBusinessReviews, recordBusinessVisit, Service, BusinessHours, Review } from '../lib/api';
import { supabase } from '../lib/supabase';
import {
  BusinessHeader,
  ServicesList,
  BusinessHoursList,
  BusinessLocation,
  ReviewsSection
} from '../components/business/public';
import SEO from '../components/SEO';
import EmptyState from '../components/ui/EmptyState';
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
  const [businessData, setBusinessData] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

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
        if (sS && sD) { setServices(sD); if (sD.length > 0) setSelectedService(sD[0].id); }

        try { setBusinessHours(await getBusinessHours(business.id)); } catch {}

        try {
          const { success: rS, data: rD } = await getBusinessReviews(business.id);
          if (rS && rD) {
            setReviews(rD);
            setAverageRating(rD.length > 0 ? rD.reduce((sum, r) => sum + r.rating, 0) / rD.length : 0);
          }
        } catch {}
      } catch { setError('Error al cargar la información del negocio'); }
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

  const handleServiceSelection = (serviceId: string) => {
    setSelectedService(serviceId);
    if (businessData?.config?.permitir_reservas_online) {
      if (!user) { navigate(`/login?redirect=/${slug}/book/${serviceId}`); }
      else { navigate(`/${slug}/book/${serviceId}`); }
    }
  };

  const businessSchema = businessData ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessData.name,
    "description": businessData.description,
    "image": businessData.logo_url,
    "address": { "@type": "PostalAddress", "streetAddress": businessData.address },
    "telephone": businessData.phone,
    "url": window.location.href,
    "aggregateRating": averageRating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": reviews.length
    } : undefined
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO
        title={businessData.name}
        description={businessData.description}
        ogImage={businessData.logo_url}
        ogType="business.business"
        schemaData={businessSchema}
      />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">

        {/* Business Header */}
        <BusinessHeader businessData={businessData} averageRating={averageRating} reviewsCount={reviews.length} />

        {/* Mobile Tabs */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden md:hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'services', label: 'Servicios' },
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
          <div className="p-5 animate-in fade-in duration-300">
            {activeTab === 'services' && (
              <div>
                <ServicesList
                  services={services}
                  selectedService={selectedService}
                  onSelectService={handleServiceSelection}
                  showPrices={businessData?.config?.mostrar_precios}
                  currentUser={user}
                  businessOwnerId={businessData?.owner_id}
                />
                {user && user.id === businessData?.owner_id && (
                  <Link to="/business/dashboard?tab=services" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                    Gestionar Servicios
                  </Link>
                )}
              </div>
            )}
            {activeTab === 'hours' && (
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Horarios de Atención</h3>
                <BusinessHoursList businessHours={businessHours} />
                {user && user.id === businessData?.owner_id && (
                  <Link to="/business/dashboard?tab=availability" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                    Editar Horarios
                  </Link>
                )}
              </div>
            )}
            {activeTab === 'location' && businessData?.config?.mostrar_direccion && (
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Ubicación</h3>
                <BusinessLocation address={businessData.address} />
                {user && user.id === businessData?.owner_id && (
                  <Link to="/business/dashboard?tab=profile" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                    Editar Perfil
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Reviews */}
        <div className="mt-8 md:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <ReviewsSection businessId={businessData.id} />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="mt-8 hidden md:grid md:grid-cols-3 gap-8">
          {/* Main */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Servicios Disponibles</h2>
              <ServicesList
                services={services}
                selectedService={selectedService}
                onSelectService={handleServiceSelection}
                showPrices={businessData?.config?.mostrar_precios}
                currentUser={user}
                businessOwnerId={businessData?.owner_id}
              />
              {user && user.id === businessData?.owner_id && (
                <Link to="/business/dashboard?tab=services" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Gestionar Servicios
                </Link>
              )}
            </div>

            <ReviewsSection businessId={businessData.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hours */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  Ubicación
                </h2>
                <BusinessLocation address={businessData.address} />
                {user && user.id === businessData?.owner_id && (
                  <Link to="/business/dashboard?tab=profile" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all w-full justify-center">
                    Editar Perfil
                  </Link>
                )}
              </div>
            )}

            {!user && (
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 text-center">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  <Link to="/login" className="underline decoration-amber-500/50 hover:text-amber-600 transition-colors">Inicia sesión</Link> para reservar servicios.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessPublicPage;
