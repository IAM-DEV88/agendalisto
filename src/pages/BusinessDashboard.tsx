import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Business,
} from '../lib/api';
import { ApiClient } from '../lib/apiClient';
import AppointmentsSection from '../components/business/AppointmentsSection';
import BusinessProfileSection from '../components/business/BusinessProfileSection';
import BusinessHoursSection from '../components/business/BusinessHoursSection';
import BusinessConfigSection from '../components/business/BusinessConfigSection';
import ServicesSection from '../components/business/ServicesSection';
import ClientsSection from '../components/business/ClientsSection';
import StatsSection from '../components/business/StatsSection';
import { useToast } from '../hooks/useToast';
import { useBusinessAppointments } from '../hooks/useBusinessAppointments';
import { useSwipeable } from 'react-swipeable';
import { useUIConfig } from '../hooks/useUIConfig';
import { useAuth } from '../hooks/useAuth';
import { useBusinessConfig } from '../hooks/useBusinessConfig';
import { useBusinessHours } from '../hooks/useBusinessHours';
import { useBusinessClients } from '../hooks/useBusinessClients';
import { supabase } from '../lib/supabase';

// UI Components
import TabNav, { Tab } from '../components/ui/TabNav';
import Pagination from '../components/ui/Pagination';
import SectionHeader from '../components/ui/SectionHeader';
import MessageAlert from '../components/ui/MessageAlert';
import BusinessHistorySection from '../components/business/BusinessHistorySection';

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
  const [searchParams, setSearchParams] = useSearchParams();
  // Tab persistence: initialize from URL or default to 'pending'
  const defaultTab = searchParams.get('tab') || 'pending';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [businessMessage, setBusinessMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingBusiness, setSavingBusiness] = useState(false);
  
  // Use custom hooks for business data
  const { appointments: businessAppointments, loading: loadingBusinessAppointments, refreshAppointments } = 
    useBusinessAppointments(businessData?.id || null);
  const { config: businessConfig, loading: loadingBusinessConfig, saving: savingBusinessConfig, 
    message: configMessage, updateConfig: handleConfigChange, saveConfig: handleConfigSave } = 
    useBusinessConfig(businessData?.id);
  const { businessHours, loading: loadingBusinessHours, saving: savingBusinessHours, 
    message: hoursMessage, updateHour: handleHoursChange, saveHours: handleHoursSubmit } = 
    useBusinessHours(businessData?.id);
  const { clients: businessClients, loading: loadingBusinessClients, 
    message: clientsMessage } = useBusinessClients(businessData?.id);

  // Business services count (can be moved to a hook in the future)
  const [totalServices, setTotalServices] = useState(0);
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Pagination for different tabs
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [clientsPage, setClientsPage] = useState(1);

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

  // Handle tab change and update URL search param
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Swipe handlers para cambiar tabs con gesto horizontal
  const tabOrder = ['pending', 'appointments', 'history', 'services', 'clients', 'stats', 'profile', 'availability', 'settings'] as const;
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

  const handleUpdateAppointmentStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const response = await ApiClient.updateAppointmentStatus(id, newStatus);
      
      if (response.success) {
        const statusText =
          newStatus === 'confirmed' ? 'confirmada' :
          newStatus === 'completed' ? 'completada' :
          newStatus === 'cancelled' ? 'cancelada' :
          'actualizada';
        toast.success(`Cita ${statusText} correctamente`);
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
        whatsapp: businessData.whatsapp,
        instagram: businessData.instagram,
        facebook: businessData.facebook,
        email: businessData.email,
        category_id: businessData.category_id,
        website: businessData.website,
        lat: businessData.lat,
        lng: businessData.lng
      });
      
      if (response.success && response.data) {
        setBusinessData(response.data);
        setBusinessMessage({ text: 'Datos del negocio actualizados correctamente', type: 'success' });
        toast.success('Datos del negocio actualizados correctamente');
      } else {
        setBusinessMessage({ text: response.error || 'Error al actualizar datos del negocio', type: 'error' });
        toast.error(response.error || 'Error al actualizar datos del negocio');
      }
    } catch (err: any) {
      setBusinessMessage({ text: err.message || 'Error al actualizar datos del negocio', type: 'error' });
      toast.error(err.message || 'Error al actualizar datos del negocio');
    } finally {
      setSavingBusiness(false);
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
    { id: 'pending', label: 'Pendientes', count: pendingAppointments.length },
    { id: 'appointments', label: 'Agendado', count: confirmedAppointments.length },
    { id: 'history', label: 'Historial', count: pastAppointments.length },
    { id: 'services', label: 'Servicios', count: totalServices },
    { id: 'clients', label: 'Clientes', count: businessClients.length }
  ];
  // Add stats tab after clients if we have business data
  if (businessData) {
    tabs.push({ id: 'stats', label: 'Estadísticas' });
  }
  // Add remaining tabs
  tabs.push(
    { id: 'profile', label: 'Datos' },
    { id: 'availability', label: 'Horarios' },
    { id: 'settings', label: 'Configuración' }
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          <div className="flex items-center justify-between mb-4 sm:flex sm:items-baseline">
            {businessData && (
              <Link to={`/${slugify(businessData.name)}`} className="flex items-center space-x-4">
                <img
                  src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                  alt={`${businessData.name} logo`}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <h3 className="text-lg leading-6 font-medium text-gray-900 grow dark:text-white">
                  {businessData.name}
                </h3>
              </Link>
            )}
            <div className="flex flex-col items-center gap-4">
              <Link to="/dashboard" className="dark:text-white dark:hover:text-black inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                Mi Perfil
              </Link>
            </div>
          </div>

          {/* Show messages for tabs except profile, availability, settings */}
          {businessMessage && activeTab !== 'profile' && activeTab !== 'availability' && activeTab !== 'settings' && (
            <MessageAlert message={businessMessage} />
          )}

          {/* Use TabNav component */}
          <TabNav 
            tabs={tabs} 
            activeTabId={activeTab} 
            onTabChange={handleTabChange} 
          />

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
                <SectionHeader 
                  title="Citas Pendientes" 
                  description="Solicitudes de citas que requieren confirmación."
                />
                <AppointmentsSection
                  appointments={pagedPending}
                  loading={loadingBusinessAppointments}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
                {/* Use Pagination component */}
                <Pagination 
                  currentPage={pendingPage}
                  totalPages={Math.ceil(pendingAppointments.length / itemsPerPage)}
                  onPageChange={setPendingPage}
                />
              </>
            )}
            
            {/* Tab de Agendado */}
            {activeTab === 'appointments' && (
              <>
                <SectionHeader 
                  title="Citas Confirmadas" 
                  description="Citas confirmadas y programadas."
                />
                <AppointmentsSection
                  appointments={pagedConfirmed}
                  loading={loadingBusinessAppointments}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
                {/* Use Pagination component */}
                <Pagination 
                  currentPage={appointmentsPage}
                  totalPages={Math.ceil(confirmedAppointments.length / itemsPerPage)}
                  onPageChange={setAppointmentsPage}
                />
              </>
            )}
            
            {/* Tab de Historial */}
            {activeTab === 'history' && businessData && (
              <>
                <SectionHeader 
                  title="Historial de Citas" 
                  description="Citas completadas y pasadas."
                />
                <BusinessHistorySection
                  businessId={businessData!.id}
                  appointments={pagedPast}
                  loading={loadingBusinessAppointments}
                  currentPage={historyPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setHistoryPage}
                />
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
                  loading={loadingBusinessClients}
                  message={clientsMessage}
                />
                {/* Use Pagination component */}
                <Pagination 
                  currentPage={clientsPage}
                  totalPages={Math.ceil(businessClients.length / itemsPerPage)}
                  onPageChange={setClientsPage}
                />
              </>
            )}

            {/* Tab de Datos del Negocio */}
            {activeTab === 'profile' && businessData && (
              <>
                <SectionHeader 
                  title="Datos del Negocio" 
                  description="Actualiza la información de tu negocio."
                />
                <BusinessProfileSection
                  businessData={businessData}
                  saving={savingBusiness}
                  message={businessMessage}
                  onSave={handleBusinessSubmit}
                  onChange={handleBusinessChange}
                />
              </>
            )}

            {/* Tab de Horarios */}
            {activeTab === 'availability' && (
              <>
                <SectionHeader 
                  title="Horarios de Atención" 
                  description="Configura los días y horarios de atención de tu negocio."
                />
                <BusinessHoursSection
                  businessHours={businessHours}
                  loading={loadingBusinessHours}
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
                  loading={loadingBusinessConfig}
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
