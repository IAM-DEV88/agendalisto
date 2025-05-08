import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Business } from '../lib/api';
import { ApiClient } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
import { AppointmentStatus } from '../types/appointment';
import { useBusinessAppointments } from '../hooks/useBusinessAppointments';
import { useToast } from '../hooks/useToast';
import { useUIConfig } from '../hooks/useUIConfig';
import { useAuth } from '../hooks/useAuth';
import { useBusinessConfig } from '../hooks/useBusinessConfig';
import { useBusinessHours } from '../hooks/useBusinessHours';
import { useBusinessClients } from '../hooks/useBusinessClients';

// UI Components
import TabNav, { Tab } from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import StatsSection from '../components/business/StatsSection';
import ClientsSection from '../components/business/ClientsSection';
import BusinessProfileSection from '../components/business/BusinessProfileSection';
import BusinessConfigSection from '../components/business/BusinessConfigSection';
import BusinessHoursSection from '../components/business/BusinessHoursSection';
import ServicesSection from '../components/business/ServicesSection';
import AppointmentList from '../components/appointments/AppointmentList';
import Pagination from '../components/ui/Pagination';

// Helper to create slug from business name
const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const { itemsPerPage } = useUIConfig();
  const toast = useToast();
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [businessMessage, setBusinessMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingBusiness, setSavingBusiness] = useState(false);
  
  // Use custom hooks for business data
  const { appointments: businessAppointments, refreshAppointments } = 
    useBusinessAppointments(businessData?.id || null);
  const { config: businessConfig, saving: savingBusinessConfig, 
    message: configMessage, updateConfig: handleConfigChange, saveConfig: handleConfigSave } = 
    useBusinessConfig(businessData?.id);
  const { businessHours, saving: savingBusinessHours, 
    message: hoursMessage, updateHour: handleHoursChange, saveHours: handleHoursSubmit } = 
    useBusinessHours(businessData?.id);
  const { clients: businessClients, message: clientsMessage } = useBusinessClients(businessData?.id);

  // Business services count (can be moved to a hook in the future)
  const [totalServices, setTotalServices] = useState(0);
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Pagination for different sections
  const [pagination, setPagination] = useState({
    pending: { page: 1, perPage: itemsPerPage },
    confirmed: { page: 1, perPage: itemsPerPage },
    history: { page: 1, perPage: itemsPerPage },
    clients: { page: 1, perPage: itemsPerPage }
  });

  const handlePageChange = (section: keyof typeof pagination, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage }
    }));
  };

  // Calculate active appointments count (pending + confirmed)
  const activeAppointmentsCount = businessAppointments.filter(a => a.status === 'pending').length + businessAppointments.filter(a => a.status === 'confirmed').length;

  // Handle tab change
  const [activeTab, setActiveTab] = useState('appointments');
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Agregar estado para controlar las secciones colapsables
  const [collapsedSections, setCollapsedSections] = useState({
    pending: true,
    confirmed: true,
    history: true
  });

  const toggleSection = (section: 'pending' | 'confirmed' | 'history') => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const loadBusinessData = async () => {
      if (!user?.id) return;

      try {
        const response = await ApiClient.getUserBusiness(user.id);
        
        if (response.success && response.data) {
          setBusinessData(response.data);
          
          // Load total services count
          const servicesResponse = await ApiClient.getBusinessServices(response.data.id);
          if (servicesResponse.success && servicesResponse.data) {
            setTotalServices(servicesResponse.data.length);
          }
        } else {
          setBusinessMessage({
            text: response.error || 'No se encontró información de tu negocio',
            type: 'error'
          });
        }
      } catch (err: any) {
        setBusinessMessage({
          text: err.message || 'Error al cargar los datos del negocio',
          type: 'error'
        });
        toast.error(err.message || 'Error al cargar los datos del negocio');
      }
    };

    loadBusinessData();
  }, [user?.id]);

  // Listen for review events from user profile
  useEffect(() => {
    const handleReviewEvent = (e: any) => {
      if (e.detail?.businessId === businessData?.id) {
        toast.success('Nueva reseña recibida');
        refreshAppointments();
      }
    };
    window.addEventListener('businessReviewAdded', handleReviewEvent);
    return () => {
      window.removeEventListener('businessReviewAdded', handleReviewEvent);
    };
  }, [businessData?.id, refreshAppointments]);

  // Real-time notification for new reviews via Supabase channels
  useEffect(() => {
    if (!businessData?.id) return;
    const reviewChannel = supabase
      .channel(`business-reviews-${businessData.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `business_id=eq.${businessData.id}` }, async () => {
        console.log('[BusinessDashboard] review insert event received');
        toast.success('Nueva reseña recibida');
        await refreshAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reviewChannel);
    };
  }, [businessData?.id, refreshAppointments]);

  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const response = await ApiClient.updateAppointmentStatus(id, newStatus);
      
      if (response.success) {
      const statusText =
        newStatus === 'confirmed' ? 'confirmada' :
        newStatus === 'completed' ? 'completada' :
        newStatus === 'cancelled' ? 'cancelada' :
        'actualizada';
        toast.success(`Cita ${statusText} correctamente`);
        await refreshAppointments();
      } else {
        toast.error(response.error || 'Error al actualizar el estado de la cita');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el estado de la cita');
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
      const response = await ApiClient.updateBusiness(businessData.id, {
        name: businessData.name,
        description: businessData.description,
        address: businessData.address,
        phone: businessData.phone,
        email: businessData.email,
        slug: slugify(businessData.name)
      });

      if (response.success) {
        setBusinessMessage({
          text: 'Datos del negocio actualizados correctamente',
          type: 'success'
        });
        toast.success('Datos del negocio actualizados correctamente');
      } else {
        setBusinessMessage({
          text: response.error || 'Error al actualizar los datos del negocio',
          type: 'error'
        });
        toast.error(response.error || 'Error al actualizar los datos del negocio');
      }
    } catch (err: any) {
      setBusinessMessage({
        text: err.message || 'Error al actualizar los datos del negocio',
        type: 'error'
      });
      toast.error(err.message || 'Error al actualizar los datos del negocio');
    } finally {
      setSavingBusiness(false);
    }
  };

  // Filtrar citas según estado y fecha
  const now = new Date();
  const pendingAppointments = businessAppointments.filter(a => a.status === 'pending');
  const confirmedAppointments = businessAppointments.filter(a => a.status === 'confirmed');
  const pastAppointments = businessAppointments.filter(a => a.status === 'completed' || new Date(a.start_time) <= now);

  // Calculate paginated appointments for each section
  const getPaginatedItems = <T extends any>(items: T[], section: keyof typeof pagination) => {
    const { page, perPage } = pagination[section];
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return items.slice(start, end);
  };

  const pagedPending = getPaginatedItems(pendingAppointments, 'pending');
  const pagedConfirmed = getPaginatedItems(confirmedAppointments, 'confirmed');
  const pagedPast = getPaginatedItems(pastAppointments, 'history');
  const pagedClients = getPaginatedItems(businessClients, 'clients');

  // Statistics for StatsSection
  const completedAppointments = businessAppointments.filter(a => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
  const confirmationRate = businessAppointments.length > 0 ? (businessAppointments.filter(a => a.status === 'confirmed').length / businessAppointments.length) * 100 : 0;
  const cancellationRate = businessAppointments.length > 0 ? (businessAppointments.filter(a => a.status === 'cancelled').length / businessAppointments.length) * 100 : 0;
  const avgDuration = completedAppointments.length > 0 ? completedAppointments.reduce((sum, a) => sum + (a.services?.duration ?? 0), 0) / completedAppointments.length : 0;
  const avgPrice = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;
  
  // More complex statistics calculations...
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

  // Prepare tabs for TabNav component
  const tabs: Tab[] = [
    { id: 'appointments', label: 'Citas', count: activeAppointmentsCount },
    { id: 'services', label: 'Servicios', count: totalServices },
    { id: 'clients', label: 'Clientes', count: businessClients.length },
    { id: 'stats', label: 'Estadísticas' },
    { id: 'profile', label: 'Perfil' },
    { id: 'availability', label: 'Disponibilidad' },
    { id: 'settings', label: 'Configuración' }
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto mt-6 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          <div className="flex items-center justify-between mb-4 sm:flex sm:items-baseline">
          {businessData && (
              <Link to={`/${slugify(businessData.name)}`} className="flex items-center space-x-4">
                <img
                  src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                  alt={`${businessData.name} logo`}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <h3 className="text-lg leading-6 font-medium text-gray-900 grow">
                  {businessData.name}
                </h3>
              </Link>
            )}
            <div className="flex flex-col gap-4 self-center">
              <Link to="/dashboard" className="dark:hover:text-black inline-flex px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
              Mi Perfil
            </Link>
            </div>
          </div>

          {/* Use TabNav component */}
          <TabNav 
            tabs={tabs} 
            activeTabId={activeTab} 
            onTabChange={handleTabChange} 
          />

          <div className="mt-6">
            {/* Tab de Estadísticas */}
            {activeTab === 'stats' && businessData && (
              <>
                <SectionHeader title="Estadísticas del Negocio" />
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
                peakDay={peakDayName}
                peakHour={peakHour}
                lifetimeValueAvg={lifetimeValueAvg}
              />
              </>
            )}
            
            {/* Tab de Citas */}
            {activeTab === 'appointments' && (
              <>
                {/* Citas Pendientes */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleSection('pending')}
                  >
                    <SectionHeader 
                      title={`Citas Pendientes (${pendingAppointments.length})`}
                      description="Solicitudes de citas que requieren confirmación."
                    />
                    <button className="p-2">
                      <svg 
                        className={`w-6 h-6 transform transition-transform ${collapsedSections.pending ? '-rotate-90' : 'rotate-0'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {!collapsedSections.pending && (
                    <>
                      <AppointmentList
                        appointments={pagedPending}
                        onStatusChange={handleUpdateAppointmentStatus}
                        showReviewSection={false}
                      />
                      <Pagination 
                        currentPage={pagination.pending.page}
                        totalPages={Math.ceil(pendingAppointments.length / pagination.pending.perPage)}
                        onPageChange={(page) => handlePageChange('pending', page)}
                      />
                    </>
                  )}
                </div>

                {/* Citas Confirmadas */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleSection('confirmed')}
                  >
                    <SectionHeader 
                      title={`Citas Confirmadas (${confirmedAppointments.length})`}
                      description="Citas confirmadas y programadas."
                    />
                    <button className="p-2">
                      <svg 
                        className={`w-6 h-6 transform transition-transform ${collapsedSections.confirmed ? '-rotate-90' : 'rotate-0'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {!collapsedSections.confirmed && (
                    <>
                      <AppointmentList
                        appointments={pagedConfirmed}
                        onStatusChange={handleUpdateAppointmentStatus}
                        showReviewSection={false}
                      />
                      <Pagination 
                        currentPage={pagination.confirmed.page}
                        totalPages={Math.ceil(confirmedAppointments.length / pagination.confirmed.perPage)}
                        onPageChange={(page) => handlePageChange('confirmed', page)}
                      />
                    </>
                  )}
                </div>

                {/* Historial de Citas */}
                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleSection('history')}
                  >
                    <SectionHeader 
                      title={`Historial de Citas (${pastAppointments.length})`}
                      description="Citas completadas y pasadas."
                    />
                    <button className="p-2">
                      <svg 
                        className={`w-6 h-6 transform transition-transform ${collapsedSections.history ? '-rotate-90' : 'rotate-0'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {!collapsedSections.history && (
                    <>
                      <AppointmentList
                        appointments={pagedPast}
                        onStatusChange={handleUpdateAppointmentStatus}
                        showReviewSection={true}
                      />
                      <Pagination 
                        currentPage={pagination.history.page}
                        totalPages={Math.ceil(pastAppointments.length / pagination.history.perPage)}
                        onPageChange={(page) => handlePageChange('history', page)}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {/* Tab de Servicios */}
            {activeTab === 'services' && businessData && (
              <>
                <SectionHeader 
                  title="Servicios" 
                  description="Gestiona los servicios que ofreces a tus clientes."
                />
              <ServicesSection
                businessId={businessData.id}
                  getServices={ApiClient.getBusinessServices}
                  createService={ApiClient.createBusinessService}
                  updateService={ApiClient.updateBusinessService}
                  deleteService={ApiClient.deleteBusinessService}
                  itemsPerPage={itemsPerPage}
                />
              </>
            )}

            {/* Tab de Clientes */}
            {activeTab === 'clients' && (
              <>
                <SectionHeader 
                  title="Clientes" 
                  description="Gestiona los clientes de tu negocio."
                />
                <ClientsSection
                  clients={pagedClients}
                  loading={false}
                  message={clientsMessage}
                />
                <Pagination 
                  currentPage={pagination.clients.page}
                  totalPages={Math.ceil(businessClients.length / pagination.clients.perPage)}
                  onPageChange={(page) => handlePageChange('clients', page)}
                />
              </>
            )}

            {/* Tab de Perfil */}
            {activeTab === 'profile' && businessData && (
              <>
                <SectionHeader 
                  title="Datos del Negocio" 
                  description="Actualiza la información de tu negocio."
                />
              <BusinessProfileSection
                businessData={businessData}
                  onSave={handleBusinessSubmit}
                  onChange={handleBusinessChange}
                saving={savingBusiness}
                message={businessMessage}
              />
              </>
            )}

            {/* Tab de Disponibilidad */}
            {activeTab === 'availability' && (
              <>
                <SectionHeader 
                  title="Horarios de Atención" 
                  description="Configura los días y horarios de atención de tu negocio."
                />
              <BusinessHoursSection
                businessHours={businessHours}
                loading={false}
                saving={savingBusinessHours}
                message={hoursMessage}
                onSave={handleHoursSubmit}
                onHoursChange={handleHoursChange}
                days={days}
              />
              </>
            )}

            {/* Tab de Configuración */}
            {activeTab === 'settings' && (
              <>
                <SectionHeader 
                  title="Configuración" 
                  description="Personaliza las opciones de tu negocio."
                />
              <BusinessConfigSection
                config={businessConfig}
                loading={false}
                saving={savingBusinessConfig}
                message={configMessage}
                  onSave={handleConfigSave}
                onConfigChange={handleConfigChange}
              />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard; 
