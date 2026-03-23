import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getBusinessBySlug, getBusinessServices, getBusinessHours, getBusinessReviews, Service, BusinessHours, Review } from '../lib/api';
import { supabase } from '../lib/supabase';
import {
  BusinessHeader,
  ServicesList,
  BusinessHoursList,
  BusinessLocation,
  BookingForm,
  ReviewsSection
} from '../components/business/public';

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


  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  // Fetch business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!slug) {
        setError('URL inválida');
        navigate('/');
        return;
      }

      try {
        setLoading(true);

        // Get business by slug
        const { success, business, error: businessError } = await getBusinessBySlug(slug);

        if (!success || !business) {
          setError(businessError || 'Negocio no encontrado');
          return;
        }

        setBusinessData(business);

        // Fetch services
        const { success: servicesSuccess, data: servicesData } = await getBusinessServices(business.id);
        if (servicesSuccess && servicesData) {
          setServices(servicesData);
          if (servicesData.length > 0) {
            setSelectedService(servicesData[0].id);
          }
        }

        // Fetch business hours
        try {
          const hoursData = await getBusinessHours(business.id);
          setBusinessHours(hoursData);
        } catch (hoursError) {
        }

        // Fetch business reviews and compute average rating
        try {
          const { success: reviewsSuccess, data: reviewsData } = await getBusinessReviews(business.id);
          if (reviewsSuccess && reviewsData) {
            setReviews(reviewsData);
            const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
            setAverageRating(reviewsData.length > 0 ? totalRating / reviewsData.length : 0);
          }
        } catch (reviewsError) {
        }
      } catch (err) {
        setError('Error al cargar la información del negocio');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [slug, navigate]);

  // Read reschedule param to show booking page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reschedule') === 'true') {
      const svcId = params.get('serviceId');
      if (svcId) {
        navigate(`/${slug}/book/${svcId}`);
      }
    }
  }, [location.search, navigate, slug]);

  const handleServiceSelection = (serviceId: string) => {
    setSelectedService(serviceId);
    if (businessData?.config?.permitir_reservas_online) {
      if (!user) {
        navigate(`/login?redirect=/${slug}/book/${serviceId}`);
      } else {
        navigate(`/${slug}/book/${serviceId}`);
      }
    }
  };

  const getServiceById = (id: string) => {
    return services.find(service => service.id === id) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !businessData) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto text-center">
          <div className="card p-12 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Negocio no encontrado</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">{error || 'El negocio que buscas no existe o ha sido eliminado.'}</p>
            <Link
              to="/"
              className="btn-primary inline-flex w-auto"
            >
              Volver a inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Business Header */}
        <BusinessHeader businessData={businessData} averageRating={averageRating} reviewsCount={reviews.length} />

        {/* Mobile Tabs */}
        <div className="mt-8 card overflow-hidden md:hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-4 px-4 text-center text-sm font-bold transition-all ${activeTab === 'services' 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-white dark:bg-slate-800' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Servicios
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`flex-1 py-4 px-4 text-center text-sm font-bold transition-all ${activeTab === 'hours' 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-white dark:bg-slate-800' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Horarios
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`flex-1 py-4 px-4 text-center text-sm font-bold transition-all ${activeTab === 'location' 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-white dark:bg-slate-800' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Ubicación
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'services' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Servicios Disponibles</h3>
                <ServicesList
                  services={services}
                  selectedService={selectedService}
                  onSelectService={handleServiceSelection}
                  showPrices={businessData?.config?.mostrar_precios}
                  currentUser={user}
                  businessOwnerId={businessData?.owner_id}
                />

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-8">
                    <Link to="/business/dashboard?tab=services" className="btn-secondary text-center">
                      Gestionar Servicios
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Horarios de Atención</h3>
                <BusinessHoursList businessHours={businessHours} />

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-8">
                    <Link to="/business/dashboard?tab=availability" className="btn-secondary text-center">
                      Editar Horarios
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && businessData?.config?.mostrar_direccion && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Ubicación</h3>
                <BusinessLocation address={businessData.address} />

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-8">
                    <Link to="/business/dashboard?tab=profile" className="btn-secondary text-center">
                      Editar Datos del Negocio
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Reviews Section */}
        <div className="mt-8 md:hidden">
          <div className="card p-6">
            <ReviewsSection businessId={businessData.id} />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="mt-8 hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Servicios Disponibles</h2>
              <ServicesList
                services={services}
                selectedService={selectedService}
                onSelectService={handleServiceSelection}
                showPrices={businessData?.config?.mostrar_precios}
                currentUser={user}
                businessOwnerId={businessData?.owner_id}
              />

              {user && user.id === businessData?.owner_id && (
                <div className="mt-8">
                  <Link to="/business/dashboard?tab=services" className="btn-secondary inline-flex w-auto px-6">
                    Gestionar Servicios
                  </Link>
                </div>
              )}
            </div>
            
            {/* Reviews Section */}
            <div className="card p-8">
              <ReviewsSection businessId={businessData.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Hours */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Horarios de Atención</h2>
              <BusinessHoursList businessHours={businessHours} />

              {user && user.id === businessData?.owner_id && (
                <div className="mt-8">
                  <Link to="/business/dashboard?tab=availability" className="btn-secondary text-center">
                    Editar Horarios
                  </Link>
                </div>
              )}
            </div>

            {/* Location */}
            {businessData?.config?.mostrar_direccion && (
              <div className="card p-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Ubicación</h2>
                <BusinessLocation address={businessData.address} />

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-8">
                    <Link to="/business/dashboard?tab=profile" className="btn-secondary text-center">
                      Editar Perfil
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Booking Button (Desktop) */}
            {selectedService && businessData?.config?.permitir_reservas_online && user && user.id !== businessData?.owner_id && (
              <div className="card p-8 bg-primary-600 dark:bg-primary-900">
                <h2 className="text-xl font-bold text-white mb-4">¿Listo para reservar?</h2>
                <p className="text-primary-100 mb-6 text-sm">Selecciona un servicio y solicita tu cita ahora mismo.</p>
                <button
                  onClick={() => setShowBooking(true)}
                  className="w-full bg-white text-primary-700 py-3 px-4 rounded-xl font-bold hover:bg-primary-50 transition-all shadow-lg"
                >
                  Reservar Ahora
                </button>
              </div>
            )}

            {!user && (
              <div className="card p-8 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  Debes <Link to="/login" className="underline font-bold decoration-amber-500/50 hover:text-amber-600 transition-colors">iniciar sesión</Link> para reservar servicios.
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
