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
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Read reschedule param to show booking form
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reschedule') === 'true') {
      const svcId = params.get('serviceId');
      if (svcId) setSelectedService(svcId);
      setShowBooking(true);
    }
  }, [location.search]);

  const handleServiceSelection = (serviceId: string) => {
    setSelectedService(serviceId);
    if (businessData?.config?.permitir_reservas_online) {
      setShowBooking(true);
    } else {
    }
  };

  const getServiceById = (id: string) => {
    return services.find(service => service.id === id) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !businessData) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Negocio no encontrado</h2>
          <p className="text-lg text-gray-600 mb-8">{error || 'El negocio que buscas no existe o ha sido eliminado.'}</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Business Header */}
        <BusinessHeader businessData={businessData} averageRating={averageRating} reviewsCount={reviews.length} />

        {/* Mobile Tabs */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md overflow-hidden md:hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'services' ? 'dark:text-white border-b-2 border-indigo-600' : 'text-gray-500'
                }`}
            >
              Servicios
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'hours' ? 'dark:text-white border-b-2 border-indigo-600' : 'text-gray-500'
                }`}
            >
              Horarios
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'location' ? 'dark:text-white border-b-2 border-indigo-600' : 'text-gray-500'
                }`}
            >
              Ubicación
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'services' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Servicios Disponibles</h3>
                <ServicesList
                  services={services}
                  selectedService={selectedService}
                  onSelectService={handleServiceSelection}
                  showPrices={businessData?.config?.mostrar_precios}
                  currentUser={user}
                  businessOwnerId={businessData?.owner_id}
                />

                {selectedService && businessData?.config?.permitir_reservas_online && user && user.id !== businessData?.owner_id && (
                  <div className="mt-6">
                    <button
                      className="w-full bg-indigo-600 text-white py-2 px-4 font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Reservar Ahora
                    </button>
                  </div>
                )}

                {showBooking && user && user.id !== businessData?.owner_id && (
                  <div className="mt-6 bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
                    <BookingForm
                      businessId={businessData.id}
                      serviceId={selectedService || ''}
                      userId={user.id}
                      service={getServiceById(selectedService || '')}
                      onClose={() => setShowBooking(false)}
                      showPrices={businessData.config.mostrar_precios}
                      requireConfirmation={businessData.config.requiere_confirmacion}
                      notifyEmail={businessData.config.notificaciones_email}
                      notifyWhatsapp={businessData.config.notificaciones_whatsapp}
                      minCancellationHours={businessData.config.tiempo_minimo_cancelacion}
                    />
                  </div>
                )}

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-6">
                    <Link to="/business/dashboard?tab=services" className="w-full block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                      Gestionar Servicios
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Horarios de Atención</h3>
                <BusinessHoursList businessHours={businessHours} />

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-6">
                    <Link to="/business/dashboard?tab=availability" className="w-full block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                      Editar Horarios
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && businessData?.config?.mostrar_direccion && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Ubicación</h3>
                <BusinessLocation address={businessData.address} />

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-6">
                    <Link to="/business/dashboard?tab=profile" className="w-full block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                      Editar Datos del Negocio
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Reviews Section */}
        <div className="mt-6 md:hidden">
          <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
            <ReviewsSection businessId={businessData.id} currentUser={user} />
          </div>
        </div>

        {/* Desktop Layout - hidden on mobile to prevent duplicate booking forms */}
        <div className="mt-6 hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6 hidden md:block">
              <h2 className="text-xl font-semibold mb-6">Servicios Disponibles</h2>
              <ServicesList
                services={services}
                selectedService={selectedService}
                onSelectService={handleServiceSelection}
                showPrices={businessData?.config?.mostrar_precios}
                currentUser={user}
                businessOwnerId={businessData?.owner_id}
              />

              {user && user.id === businessData?.owner_id && (
                <div className="mt-6">
                  <Link to="/business/dashboard?tab=services" className="block text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                    Gestionar Servicios
                  </Link>
                </div>
              )}
            </div>

            {/* Booking Form */}
            {showBooking && user && user.id !== businessData?.owner_id && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
                <BookingForm
                  businessId={businessData.id}
                  serviceId={selectedService || ''}
                  userId={user.id}
                  service={getServiceById(selectedService || '')}
                  onClose={() => setShowBooking(false)}
                  showPrices={businessData.config.mostrar_precios}
                  requireConfirmation={businessData.config.requiere_confirmacion}
                  notifyEmail={businessData.config.notificaciones_email}
                  notifyWhatsapp={businessData.config.notificaciones_whatsapp}
                  minCancellationHours={businessData.config.tiempo_minimo_cancelacion}
                />
              </div>
            )}
            {/* Reviews Section */}
            <div className="mt-6 hidden md:block">
              <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
                <ReviewsSection businessId={businessData.id} currentUser={user} />
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6 hidden md:block">
            {/* Hours */}
            <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Horarios de Atención</h2>
              <BusinessHoursList businessHours={businessHours} />

              {user && user.id === businessData?.owner_id && (
                <div className="mt-6">
                  <Link to="/business/dashboard?tab=availability" className="block text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                    Editar Horarios
                  </Link>
                </div>
              )}
            </div>

            {/* Location */}
            {businessData?.config?.mostrar_direccion && (
              <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Ubicación</h2>
                <BusinessLocation address={businessData.address} />

                {user && user.id === businessData?.owner_id && (
                  <div className="mt-6">
                    <Link to="/business/dashboard?tab=profile" className="block text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                      Editar Datos del Negocio
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Booking Button */}
            {selectedService && businessData?.config?.permitir_reservas_online && user && user.id !== businessData?.owner_id && (
              <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Reservar Cita</h2>
                <button
                  className="w-full bg-indigo-600 text-white py-2 px-4 font-medium hover:bg-indigo-700 transition-colors"
                >
                  Reservar Ahora
                </button>
              </div>
            )}


            {!user && (
              <div className="bg-gray-50 dark:bg-gray-50 dark:bg-opacity-10 shadow-md p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    Debes <Link to="/login" className="font-medium underline">iniciar sesión</Link> para reservar servicios.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default BusinessPublicPage; 
