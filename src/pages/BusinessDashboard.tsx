import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getUserBusiness,
  updateAppointmentStatus,
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
} from '../lib/api';
import { UserProfile } from '../lib/supabase';
import AppointmentsSection from '../components/business/AppointmentsSection';
import BusinessProfileSection from '../components/business/BusinessProfileSection';
import BusinessHoursSection from '../components/business/BusinessHoursSection';
import BusinessConfigSection from '../components/business/BusinessConfigSection';
import ServicesSection from '../components/business/ServicesSection';
import ClientsSection from '../components/business/ClientsSection';
import StatsSection from '../components/business/StatsSection';
import { notifySuccess, notifyError } from '../lib/toast';
import { useBusinessAppointments } from '../hooks/useBusinessAppointments';
import { useSwipeable } from 'react-swipeable';
import { useItemsPerPage } from '../hooks/useItemsPerPage';
import { useAuth } from '../hooks/useAuth';

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const { itemsPerPage } = useItemsPerPage(user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  // Tab persistence: initialize from URL or default to 'appointments'
  const defaultTab = searchParams.get('tab') || 'appointments';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [businessData, setBusinessData] = useState<Business | null>(null);
  // Realtime business appointments via hook
  const { appointments: businessAppointments, loading: loadingBusinessAppointments, error: businessAppointmentsError } = useBusinessAppointments(businessData?.id || null);
  console.log('[useBusinessAppointments]', { businessAppointments, loadingBusinessAppointments, businessAppointmentsError });
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
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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

  // Paginación para Agenda, Historial, Pendientes y Clientes
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
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
        setLoadingBusinessHours(false);
        setLoadingBusinessConfig(false);
      }, 20000); // 20 segundos máximo para toda la operación

      try {
        // Cargar datos del negocio
        const { success, business, error: businessError } = await getUserBusiness(user.id);
        if (success && business) {
          setBusinessData(business);

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
            setClientsMessage({ text: 'Error al cargar los clientes del negocio.', type: 'error' });
            setLoadingBusinessClients(false);
          }
        } else {
          // Redirigir si no hay negocio
          setBusinessMessage({
            text: businessError ? `Error: ${businessError}` : 'No se encontró información de tu negocio',
            type: 'error'
          });
          setLoadingBusinessHours(false);
          setLoadingBusinessConfig(false);
        }
      } catch (err) {
        setBusinessMessage({
          text: 'Error al cargar los datos del negocio. Por favor, recarga la página.',
          type: 'error'
        });
        setLoadingBusinessHours(false);
        setLoadingBusinessConfig(false);
      } finally {
        clearTimeout(mainTimeoutId);
      }
    };

    loadBusinessData();

    // Limpieza al desmontar
    return () => {
      setLoadingBusinessHours(false);
      setLoadingBusinessConfig(false);
    };
  }, [user]);

  // Handle tab change and update URL search param
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Swipe handlers para cambiar tabs con gesto horizontal
  const tabOrder = ['stats', 'pending', 'appointments', 'history', 'services', 'clients', 'profile', 'availability', 'settings'] as const;
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabOrder.indexOf(activeTab as typeof tabOrder[number]);
      if (idx < tabOrder.length - 1) handleTabChange(tabOrder[idx + 1]);
    },
    onSwipedRight: () => {
      const idx = tabOrder.indexOf(activeTab as typeof tabOrder[number]);
      if (idx > 0) handleTabChange(tabOrder[idx - 1]);
    },
    trackMouse: true,
    trackTouch: true,
  });

  // Efecto para desplazar el tab activo al centro de la vista
  useEffect(() => {
    const btn = document.getElementById(`tab-${activeTab}`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab]);

  const handleUpdateAppointmentStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await updateAppointmentStatus(id, newStatus);
      const statusText =
        newStatus === 'confirmed' ? 'confirmada' :
        newStatus === 'completed' ? 'completada' :
        newStatus === 'cancelled' ? 'cancelada' :
        'actualizada';
      notifySuccess(`Cita ${statusText} correctamente`);
    } catch (err: any) {
      notifyError(err.message || 'Error al actualizar el estado de la cita');
    }
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        phone: businessData.phone,
        whatsapp: businessData.whatsapp,
        instagram: businessData.instagram,
        facebook: businessData.facebook,
        email: businessData.email,
        category_id: businessData.category_id,
        website: businessData.website,
        lat: businessData.lat,
        lng: businessData.lng
      });
      setBusinessData(updated);
      setBusinessMessage({ text: 'Datos del negocio actualizados correctamente', type: 'success' });
      notifySuccess('Datos del negocio actualizados correctamente');
    } catch (err: any) {
      setBusinessMessage({ text: err.message || 'Error al actualizar datos del negocio', type: 'error' });
      notifyError(err.message || 'Error al actualizar datos del negocio');
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
      notifySuccess('Horarios actualizados correctamente');
    } catch (err: any) {
      setHoursMessage({ text: err.message || 'Error al actualizar horarios', type: 'error' });
      notifyError(err.message || 'Error al actualizar horarios');
    } finally {
      setSavingBusinessHours(false);
    }
  };

  // Manejar cambios en la configuración
  const handleConfigChange = (field: keyof BusinessConfig, value: any) => {
    setBusinessConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar envío del formulario de configuración
  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusinessConfig(true);
    setConfigMessage(null);

    try {
      const result = await updateBusinessConfig(businessData?.id || '', businessConfig);
      if (result.success) {
        setConfigMessage({ text: 'Configuración guardada correctamente', type: 'success' });
        notifySuccess('Configuración guardada correctamente');
      } else {
        setConfigMessage({ text: result.error || 'Error al guardar la configuración', type: 'error' });
        notifyError(result.error || 'Error al guardar la configuración');
      }
    } catch (err: any) {
      setConfigMessage({ text: err.message || 'Error al guardar la configuración', type: 'error' });
      notifyError(err.message || 'Error al guardar la configuración');
    } finally {
      setSavingBusinessConfig(false);
    }
  };

  // Filtrar citas según estado y fecha
  const now = new Date();
  const pendingAppointments = businessAppointments.filter(a => a.status === 'pending');
  const confirmedAppointments = businessAppointments.filter(a => a.status === 'confirmed');
  const pastAppointments = businessAppointments.filter(a => a.status === 'completed' || new Date(a.start_time) <= now);

  // Paginación de resultados
  const pagedPending = pendingAppointments.slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage);
  const pagedConfirmed = confirmedAppointments.slice((appointmentsPage - 1) * itemsPerPage, appointmentsPage * itemsPerPage);
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
                onClick={() => handleTabChange('stats')}
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
            <nav className="-mb-px flex space-x-2 overflow-x-auto whitespace-nowrap">
              <button id="tab-pending" onClick={() => handleTabChange('pending')} className={`${activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pendientes:<span className="ml-1 text-gray-500 dark:text-gray-400">{pendingAppointments.length}</span>
              </button>
              <button id="tab-appointments" onClick={() => handleTabChange('appointments')} className={`${activeTab === 'appointments'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Agendado:<span className="ml-1 text-gray-500 dark:text-gray-400">{confirmedAppointments.length}</span>
              </button>
              <button id="tab-history" onClick={() => handleTabChange('history')} className={`${activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Historial:<span className="ml-1 text-gray-500 dark:text-gray-400">{pastAppointments.length}</span>
              </button>
              <button id="tab-services" onClick={() => handleTabChange('services')} className={`${activeTab === 'services'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Servicios:<span className="ml-1 text-gray-500 dark:text-gray-400">{totalServices}</span>
              </button>
              <button id="tab-clients" onClick={() => handleTabChange('clients')} className={`${activeTab === 'clients'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Clientes:<span className="ml-1 text-gray-500 dark:text-gray-400">{businessClients.length}</span>
              </button>
              <button id="tab-profile" onClick={() => handleTabChange('profile')} className={`${activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Datos
              </button>
              <button id="tab-availability" onClick={() => handleTabChange('availability')} className={`${activeTab === 'availability'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Horarios
              </button>
              <button id="tab-settings" onClick={() => handleTabChange('settings')} className={`${activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Configuración
              </button>
            </nav>
          </div>

          <div className="mt-2" {...swipeHandlers}>
            {activeTab === 'stats' && businessData && (
              <StatsSection
                totalAppointments={businessAppointments.length}
                upcomingAppointments={confirmedAppointments.length}
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
              />
            )}
            {/* Tab de Pendientes */}
            {activeTab === 'pending' && (
              <>
                <AppointmentsSection
                  appointments={pagedPending}
                  loading={loadingBusinessAppointments}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
                {/* Paginación Pendientes */}
                {Math.ceil(pendingAppointments.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center mt-4">
                    <nav className="flex items-center space-x-2">
                      <button onClick={() => setPendingPage(pendingPage - 1)} disabled={pendingPage === 1} className="px-3 py-1 rounded bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                      {Array.from({ length: Math.ceil(pendingAppointments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setPendingPage(page)} className={`px-3 py-1 ${pendingPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                      ))}
                      <button onClick={() => setPendingPage(pendingPage + 1)} disabled={pendingPage === Math.ceil(pendingAppointments.length / itemsPerPage)} className="px-3 py-1 rounded bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
                    </nav>
                  </div>
                )}
              </>
            )}
            {/* Tab de Agendado */}
            {activeTab === 'appointments' && (
              <>
                <AppointmentsSection
                  appointments={pagedConfirmed}
                  loading={loadingBusinessAppointments}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
                {/* Paginación Agendado */}
                {Math.ceil(confirmedAppointments.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center mt-4">
                    <nav className="flex items-center space-x-2">
                      <button onClick={() => setAppointmentsPage(appointmentsPage - 1)} disabled={appointmentsPage === 1} className="px-3 py-1 rounded bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                      {Array.from({ length: Math.ceil(confirmedAppointments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setAppointmentsPage(page)} className={`px-3 py-1 ${appointmentsPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                      ))}
                      <button onClick={() => setAppointmentsPage(appointmentsPage + 1)} disabled={appointmentsPage === Math.ceil(confirmedAppointments.length / itemsPerPage)} className="px-3 py-1 rounded bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
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
                      <button onClick={() => setHistoryPage(historyPage - 1)} disabled={historyPage === 1} aria-label="Anterior" className="px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                      {Array.from({ length: Math.ceil(pastAppointments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setHistoryPage(page)} className={`px-3 py-1 rounded-md ${historyPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                      ))}
                      <button onClick={() => setHistoryPage(historyPage + 1)} disabled={historyPage === Math.ceil(pastAppointments.length / itemsPerPage)} aria-label="Siguiente" className="px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
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
                itemsPerPage={itemsPerPage}
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
                      <button onClick={() => setClientsPage(clientsPage - 1)} disabled={clientsPage === 1} aria-label="Anterior" className="px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                      {Array.from({ length: Math.ceil(businessClients.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setClientsPage(page)} className={`px-3 py-1 rounded-md ${clientsPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                      ))}
                      <button onClick={() => setClientsPage(clientsPage + 1)} disabled={clientsPage === Math.ceil(businessClients.length / itemsPerPage)} aria-label="Siguiente" className="px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
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
                onSave={handleConfigSave}
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
