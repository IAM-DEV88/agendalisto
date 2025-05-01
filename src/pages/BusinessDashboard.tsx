import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getUserBusiness,
  getBusinessAppointments,
  updateAppointmentStatus,
  getBusinessReviews,
  getBusinessClients,
  updateBusiness,
  getBusinessHours,
  setBusinessHours as updateBusinessHoursAPI,
  getBusinessConfig,
  updateBusinessConfig,
  getBusinessServices,
  createBusinessService,
  updateBusinessService,
  deleteBusinessService,
  Business,
  BusinessHours,
  BusinessConfig,
  Review,
} from '../lib/api';
import { UserProfile } from '../lib/supabase';
import AppointmentsSection from '../components/business/AppointmentsSection';
import BusinessProfileSection from '../components/business/BusinessProfileSection';
import BusinessHoursSection from '../components/business/BusinessHoursSection';
import BusinessConfigSection from '../components/business/BusinessConfigSection';
import ServicesSection from '../components/business/ServicesSection';
import ClientsSection from '../components/business/ClientsSection';
import StatsSection from '../components/business/StatsSection';

type BusinessDashboardProps = {
  user: UserProfile | null;
};

const BusinessDashboard = ({ user }: BusinessDashboardProps) => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [businessAppointments, setBusinessAppointments] = useState<any[]>([]);
  const [loadingBusinessAppointments, setLoadingBusinessAppointments] = useState(true);
  const [businessHours, setBusinessHoursState] = useState<BusinessHours[]>([]);
  const [loadingBusinessHours, setLoadingBusinessHours] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingBusinessHours, setSavingBusinessHours] = useState(false);
  const [businessMessage, setBusinessMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hoursMessage, setHoursMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [configMessage, setConfigMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [businessClients, setBusinessClients] = useState<UserProfile[]>([]);
  const [loadingBusinessClients, setLoadingBusinessClients] = useState(true);
  const [clientsMessage, setClientsMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [totalServices, setTotalServices] = useState(0);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Estado para configuración del negocio
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>({
    permitir_reservas_online: true,
    mostrar_precios: true,
    mostrar_telefono: true,
    mostrar_email: false,
    mostrar_redes_sociales: true,
    mostrar_direccion: true,
    requiere_confirmacion: false,
    tiempo_minimo_cancelacion: 48,
    notificaciones_email: true,
    notificaciones_whatsapp: false
  });
  const [loadingBusinessConfig, setLoadingBusinessConfig] = useState(true);
  const [savingBusinessConfig, setSavingBusinessConfig] = useState(false);

  // Paginación para Agenda, Historial y Clientes
  const itemsPerPage = 4;
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [clientsPage, setClientsPage] = useState(1);

  useEffect(() => {
    const loadBusinessData = async () => {
      if (!user?.id) return;

      // Agregar un timeout general para evitar que se quede cargando indefinidamente
      const mainTimeoutId = setTimeout(() => {
        setBusinessMessage({
          text: 'La carga de los datos del negocio ha tomado demasiado tiempo. Por favor, recarga la página.',
          type: 'error'
        });
        setLoadingBusinessAppointments(false);
        setLoadingBusinessHours(false);
        setLoadingBusinessConfig(false);
      }, 20000); // 20 segundos máximo para toda la operación

      try {
        // Cargar datos del negocio
        const { success, business, error: businessError } = await getUserBusiness(user.id);
        if (success && business) {
          setBusinessData(business);

          // Cargar citas del negocio
          setLoadingBusinessAppointments(true);
          const appointmentTimeoutId = setTimeout(() => {
            setLoadingBusinessAppointments(false);
            setBusinessMessage({
              text: 'No se pudieron cargar las citas del negocio. Por favor, recarga la página.',
              type: 'error'
            });
          }, 15000);

          try {
            const { success: appSuccess, data: appData, error: appError } = await getBusinessAppointments(business.id);
            clearTimeout(appointmentTimeoutId);

            if (appSuccess && appData) {
              try {
                const { success: revSuccess, data: revData } = await getBusinessReviews(business.id);
                if (revSuccess && revData) {
                  const reviewMap: Record<string, Review> = revData.reduce((map, review) => {
                    map[review.appointment_id] = review;
                    return map;
                  }, {} as Record<string, Review>);
                  const enrichedAppointments = appData.map(app => ({ ...app, review: reviewMap[app.id] }));
                  setBusinessAppointments(enrichedAppointments);
                } else {
                  setBusinessAppointments(appData);
                }
              } catch (revErr) {
                console.error('Error fetching reviews:', revErr);
                setBusinessAppointments(appData);
              }
            } else {
              setBusinessMessage({
                text: (appError as any)?.message || 'No se pudieron cargar las citas del negocio.',
                type: 'error'
              });
            }
            setLoadingBusinessAppointments(false);
          } catch (appErr) {
            clearTimeout(appointmentTimeoutId);
            console.error('Error fetching business appointments:', appErr);
            setBusinessMessage({
              text: 'Error al cargar las citas del negocio.',
              type: 'error'
            });
            setLoadingBusinessAppointments(false);
          }

          // Cargar horarios del negocio
          setLoadingBusinessHours(true);
          const hoursTimeoutId = setTimeout(() => {
            setLoadingBusinessHours(false);
            setHoursMessage({
              text: 'No se pudieron cargar los horarios del negocio. Por favor, recarga la página.',
              type: 'error'
            });
          }, 15000);

          try {
            const hours = await getBusinessHours(business.id);
            clearTimeout(hoursTimeoutId);
            // Ensure full week array
            const fullWeek = days.map((_, idx) => {
              const found = hours.find(h => h.day_of_week === idx);
              return found
                ? found
                : { id: `${business.id}-${idx}`, business_id: business.id, day_of_week: idx, start_time: '09:00', end_time: '17:00', is_closed: true } as BusinessHours;
            });
            setBusinessHoursState(fullWeek);
            setLoadingBusinessHours(false);
          } catch (hoursErr) {
            clearTimeout(hoursTimeoutId);
            console.error('Error fetching business hours:', hoursErr);
            setHoursMessage({
              text: 'Error al cargar los horarios del negocio.',
              type: 'error'
            });
            setLoadingBusinessHours(false);
          }

          // Cargar configuración del negocio
          setLoadingBusinessConfig(true);
          const configTimeoutId = setTimeout(() => {
            setLoadingBusinessConfig(false);
            setConfigMessage({
              text: 'No se pudo cargar la configuración del negocio. Por favor, recarga la página.',
              type: 'error'
            });
          }, 15000);

          try {
            const { success: configSuccess, config, error: configError } = await getBusinessConfig(business.id);
            clearTimeout(configTimeoutId);

            if (configSuccess && config) {
              setBusinessConfig(config);
            } else {
              setConfigMessage({
                text: configError || 'No se pudo cargar la configuración del negocio.',
                type: 'error'
              });
            }
            setLoadingBusinessConfig(false);
          } catch (configErr) {
            clearTimeout(configTimeoutId);
            console.error('Error fetching business config:', configErr);
            setConfigMessage({
              text: 'Error al cargar la configuración del negocio.',
              type: 'error'
            });
            setLoadingBusinessConfig(false);
          }

          // Cargar clientes del negocio
          setLoadingBusinessClients(true);
          // Cargar total de servicios para estadísticas
          let _totalServices = 0;
          try {
            const { success: svcSuccess, data: svcData } = await getBusinessServices(business.id);
            if (svcSuccess && svcData) {
              _totalServices = svcData.length;
              setTotalServices(_totalServices);
            }
          } catch (svcErr) {
            console.error('Error fetching business services for stats:', svcErr);
          }
          const clientsTimeoutId = setTimeout(() => {
            setLoadingBusinessClients(false);
            setClientsMessage({
              text: 'No se pudieron cargar los clientes del negocio. Por favor, recarga la página.',
              type: 'error'
            });
          }, 15000);
          try {
            const { success: clientsSuccess, data: clientsData, error: clientsError } = await getBusinessClients(business.id);
            clearTimeout(clientsTimeoutId);
            if (clientsSuccess && clientsData) {
              setBusinessClients(clientsData);
            } else {
              setClientsMessage({ text: clientsError || 'No se pudieron cargar los clientes del negocio.', type: 'error' });
            }
            setLoadingBusinessClients(false);
          } catch (clientsErr) {
            clearTimeout(clientsTimeoutId);
            console.error('Error fetching business clients:', clientsErr);
            setClientsMessage({ text: 'Error al cargar los clientes del negocio.', type: 'error' });
            setLoadingBusinessClients(false);
          }
        } else {
          // Redirigir si no hay negocio
          setBusinessMessage({
            text: businessError ? `Error: ${businessError}` : 'No se encontró información de tu negocio',
            type: 'error'
          });
          setLoadingBusinessAppointments(false);
          setLoadingBusinessHours(false);
          setLoadingBusinessConfig(false);
        }
      } catch (err) {
        console.error('Error loading business data:', err);
        setBusinessMessage({
          text: 'Error al cargar los datos del negocio. Por favor, recarga la página.',
          type: 'error'
        });
        setLoadingBusinessAppointments(false);
        setLoadingBusinessHours(false);
        setLoadingBusinessConfig(false);
      } finally {
        clearTimeout(mainTimeoutId);
      }
    };

    loadBusinessData();

    // Limpieza al desmontar
    return () => {
      setLoadingBusinessAppointments(false);
      setLoadingBusinessHours(false);
      setLoadingBusinessConfig(false);
    };
  }, [user]);

  const handleUpdateAppointmentStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await updateAppointmentStatus(id, newStatus);
      if (businessData) {
        const { success, data } = await getBusinessAppointments(businessData.id);
        if (success && data) {
          setBusinessAppointments(data);
        }
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessData(prev => prev ? ({ ...prev, [name]: value } as Business) : prev);
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessData) return;
    setSavingBusiness(true);
    setBusinessMessage(null);
    try {
      const updated = await updateBusiness(businessData.id, {
        name: businessData.name,
        description: businessData.description,
        address: businessData.address,
        logo_url: businessData.logo_url,
        phone: businessData.phone,
        whatsapp: businessData.whatsapp,
        instagram: businessData.instagram,
        facebook: businessData.facebook,
        website: businessData.website,
        lat: businessData.lat,
        lng: businessData.lng
      });
      setBusinessData(updated);
      setBusinessMessage({ text: 'Datos del negocio actualizados correctamente', type: 'success' });
    } catch (err: any) {
      console.error('Error updating business:', err);
      setBusinessMessage({ text: err.message || 'Error al actualizar datos del negocio', type: 'error' });
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleHoursChange = (index: number, field: keyof Omit<BusinessHours, 'id'>, value: any) => {
    setBusinessHoursState(prev => {
      const newHours = [...prev];
      (newHours[index] as any)[field] = value;
      return newHours;
    });
  };

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessData) return;
    setSavingBusinessHours(true);
    setHoursMessage(null);
    try {
      // Prepare payload for API (no id field)
      const payload = businessHours.map(({ business_id, day_of_week, start_time, end_time, is_closed }) => ({ business_id, day_of_week, start_time, end_time, is_closed }));
      await updateBusinessHoursAPI(payload);
      setHoursMessage({ text: 'Horarios actualizados correctamente', type: 'success' });
    } catch (err: any) {
      console.error('Error updating hours:', err);
      setHoursMessage({ text: err.message || 'Error al actualizar horarios', type: 'error' });
    } finally {
      setSavingBusinessHours(false);
    }
  };

  // Manejar cambios en la configuración
  const handleConfigChange = (field: string, value: any) => {
    setBusinessConfig(prev => ({ ...prev, [field]: value }));
  };

  // Manejar envío del formulario de configuración
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessData) return;

    setSavingBusinessConfig(true);
    setConfigMessage(null);

    try {
      const { success, error } = await updateBusinessConfig(businessData.id, businessConfig);

      if (success) {
        setConfigMessage({ text: 'Configuración guardada correctamente', type: 'success' });
      } else {
        throw new Error(error || 'Error al guardar la configuración');
      }
    } catch (err: any) {
      console.error('Error updating config:', err);
      setConfigMessage({ text: err.message || 'Error al actualizar la configuración', type: 'error' });
    } finally {
      setSavingBusinessConfig(false);
    }
  };

  // Filtrar citas próximas y pasadas
  const now = new Date();
  const upcomingAppointments = businessAppointments.filter(a => new Date(a.start_time) > now);
  const pastAppointments = businessAppointments.filter(a => new Date(a.start_time) <= now);

  // Paginación de resultados
  const pagedUpcoming = upcomingAppointments.slice((appointmentsPage - 1) * itemsPerPage, appointmentsPage * itemsPerPage);
  const pagedPast = pastAppointments.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
  const pagedClients = businessClients.slice((clientsPage - 1) * itemsPerPage, clientsPage * itemsPerPage);

  // FIRST_EDIT: compute all statistics needed for StatsSection
  const completedAppointments = businessAppointments.filter(a => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
  const confirmationRate = businessAppointments.length > 0 ? (businessAppointments.filter(a => a.status === 'confirmed').length / businessAppointments.length) * 100 : 0;
  const cancellationRate = businessAppointments.length > 0 ? (businessAppointments.filter(a => a.status === 'cancelled').length / businessAppointments.length) * 100 : 0;
  const avgDuration = completedAppointments.length > 0 ? completedAppointments.reduce((sum, a) => sum + (a.services?.duration ?? 0), 0) / completedAppointments.length : 0;
  const avgPrice = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;
  const userAppointmentCounts: Record<string, number> = {};
  businessAppointments.forEach(a => {
    userAppointmentCounts[a.user_id] = (userAppointmentCounts[a.user_id] || 0) + 1;
  });
  const newClientsCount = Object.values(userAppointmentCounts).filter(count => count === 1).length;
  const returningClientsCount = Object.values(userAppointmentCounts).filter(count => count > 1).length;
  const serviceCounts: Record<string, number> = {};
  businessAppointments.forEach(a => {
    const serviceName = a.services?.name ?? '';
    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
  });
  const [topServiceName, topServiceCount] = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const clientCounts: Record<string, number> = {};
  businessAppointments.forEach(a => {
    const clientName = a.profiles?.full_name ?? '';
    clientCounts[clientName] = (clientCounts[clientName] || 0) + 1;
  });
  const [topClientName, topClientCount] = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const dayCounts: Record<number, number> = {};
  businessAppointments.forEach(a => {
    const dayIndex = new Date(a.start_time).getDay();
    dayCounts[dayIndex] = (dayCounts[dayIndex] || 0) + 1;
  });
  const peakDayIndex = Number(Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0;
  const peakDayName = days[peakDayIndex] || '-';
  const peakHourCounts: Record<number, number> = {};
  businessAppointments.forEach(a => {
    const hour = new Date(a.start_time).getHours();
    peakHourCounts[hour] = (peakHourCounts[hour] || 0) + 1;
  });
  const peakHour = Number(Object.entries(peakHourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0;
  const avgRatingAppointments = businessAppointments.filter(a => typeof a.review?.rating === 'number');
  const avgRating = avgRatingAppointments.length > 0 ? avgRatingAppointments.reduce((sum, a) => sum + (a.review?.rating ?? 0), 0) / avgRatingAppointments.length : 0;
  const lifetimeValueAvg = businessClients.length > 0 ? totalRevenue / businessClients.length : 0;

  return (
    <div>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          <div className="flex items-center justify-between mb-4 sm:flex sm:items-baseline">
          {businessData && (
              <Link
                to={`/${businessData.slug}`}
              >
                <h3 className="text-lg leading-6 font-medium text-gray-900 grow dark:text-white">{businessData?.name || 'Mi Negocio'}</h3>
              </Link>
            )}
            <div className="flex flex-col items-center gap-4">
            <Link to="/dashboard" className="dark:text-white dark:hover:text-black inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
              Mi Perfil
            </Link>

            {businessData && (
              <button
                onClick={() => setActiveTab('stats')}
                className="dark:text-white dark:hover:text-black inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50"
              >
                Estadísticas
              </button>
            )}
            </div>
          </div>

          {businessMessage && activeTab !== 'profile' && activeTab !== 'availability' && activeTab !== 'settings' && (
            <div className={`mb-4 p-4 rounded ${businessMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {businessMessage.text}
            </div>
          )}

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`${activeTab === 'appointments'
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Agenda
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Historial
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`${activeTab === 'services'
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Servicios
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`${activeTab === 'clients'
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Clientes
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`${activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Datos
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`${activeTab === 'availability'
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Horarios
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`${activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Configuración
              </button>
            </nav>
          </div>

          <div className="mt-2">
            {activeTab === 'stats' && businessData && (
              <StatsSection
                totalAppointments={businessAppointments.length}
                upcomingAppointments={upcomingAppointments.length}
                pastAppointments={pastAppointments.length}
                totalClients={businessClients.length}
                totalServices={totalServices}
                totalRevenue={totalRevenue}
                confirmationRate={confirmationRate}
                cancellationRate={cancellationRate}
                avgDuration={avgDuration}
                avgPrice={avgPrice}
                topServiceName={topServiceName}
                topServiceCount={topServiceCount}
                topClientName={topClientName}
                topClientCount={topClientCount}
                peakDay={peakDayName}
                peakHour={peakHour}
                newClients={newClientsCount}
                returningClients={returningClientsCount}
                lifetimeValueAvg={lifetimeValueAvg}
                avgRating={avgRating}
              />
            )}
            {/* Tab de Agenda */}
            {activeTab === 'appointments' && (
              <>
                <AppointmentsSection
                  appointments={pagedUpcoming}
                  loading={loadingBusinessAppointments}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
                {/* Paginación Agenda */}
                {Math.ceil(upcomingAppointments.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center mt-4">
                    <nav className="flex items-center space-x-2">
                      <button onClick={() => setAppointmentsPage(appointmentsPage - 1)} disabled={appointmentsPage === 1} aria-label="Anterior" className="px-3 bg-opacity-10 dark:text-white py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-10 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                      {Array.from({ length: Math.ceil(upcomingAppointments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setAppointmentsPage(page)} className={`px-3 py-1 ${appointmentsPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-10'}`}>{page}</button>
                      ))}
                      <button onClick={() => setAppointmentsPage(appointmentsPage + 1)} disabled={appointmentsPage === Math.ceil(upcomingAppointments.length / itemsPerPage)} aria-label="Siguiente" className="px-3 bg-opacity-10 dark:text-white py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-10 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
                    </nav>
                  </div>
                )}
              </>
            )}
            {activeTab === 'history' && (
              <>
                <AppointmentsSection
                  appointments={pagedPast}
                  loading={loadingBusinessAppointments}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
                {/* Paginación Historial */}
                {Math.ceil(pastAppointments.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center mt-4">
                    <nav className="flex items-center space-x-2">
                      <button onClick={() => setHistoryPage(historyPage - 1)} disabled={historyPage === 1} aria-label="Anterior" className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-10 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                      {Array.from({ length: Math.ceil(pastAppointments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setHistoryPage(page)} className={`px-3 py-1 rounded-md ${historyPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-10'}`}>{page}</button>
                      ))}
                      <button onClick={() => setHistoryPage(historyPage + 1)} disabled={historyPage === Math.ceil(pastAppointments.length / itemsPerPage)} aria-label="Siguiente" className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-10 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
                    </nav>
                  </div>
                )}
              </>
            )}

            {activeTab === 'services' && businessData && (
              <ServicesSection
                businessId={businessData.id}
                getServices={getBusinessServices}
                createService={createBusinessService}
                updateService={updateBusinessService}
                deleteService={deleteBusinessService}
              />
            )}

            {activeTab === 'clients' && (
              <>
                <ClientsSection
                  clients={pagedClients}
                  loading={loadingBusinessClients}
                  message={clientsMessage}
                />
                {/* Paginación Clientes */}
                {Math.ceil(businessClients.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center mt-4">
                    <nav className="flex items-center space-x-2">
                      <button onClick={() => setClientsPage(clientsPage - 1)} disabled={clientsPage === 1} aria-label="Anterior" className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-10 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                      {Array.from({ length: Math.ceil(businessClients.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setClientsPage(page)} className={`px-3 py-1 rounded-md ${clientsPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-10'}`}>{page}</button>
                      ))}
                      <button onClick={() => setClientsPage(clientsPage + 1)} disabled={clientsPage === Math.ceil(businessClients.length / itemsPerPage)} aria-label="Siguiente" className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-10 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* Tab de Datos del Negocio */}
            {activeTab === 'profile' && businessData && (
              <BusinessProfileSection
                businessData={businessData}
                saving={savingBusiness}
                message={businessMessage}
                onSave={handleBusinessSubmit}
                onChange={handleBusinessChange}
              />
            )}

            {/* Tab de Horarios */}
            {activeTab === 'availability' && (
              <BusinessHoursSection
                businessHours={businessHours}
                loading={loadingBusinessHours}
                saving={savingBusinessHours}
                message={hoursMessage}
                onSave={handleHoursSubmit}
                onHoursChange={handleHoursChange}
                days={days}
              />
            )}

            {/* Tab de Configuración */}
            {activeTab === 'settings' && (
              <BusinessConfigSection
                config={businessConfig}
                loading={loadingBusinessConfig}
                saving={savingBusinessConfig}
                message={configMessage}
                onSave={handleConfigSubmit}
                onConfigChange={handleConfigChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard; 