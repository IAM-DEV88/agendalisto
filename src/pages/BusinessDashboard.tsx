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
import BusinessAppointmentList from '../components/appointments/BusinessAppointmentList';
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
  const { appointments, refreshAppointments } = useBusinessAppointments(businessData?.id || null);
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
  const activeAppointmentsCount = appointments.filter(a => a.status === 'pending').length + appointments.filter(a => a.status === 'confirmed').length;

  // Handle tab change
  const [activeTab, setActiveTab] = useState('appointments');
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Sub-tabs for Appointments
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('pending');
  
  // Sub-tabs for Settings
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');

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
        toast.success('¡Nueva reseña recibida!');
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
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'reviews', 
        filter: `business_id=eq.${businessData.id}` 
      }, async () => {
        console.log('[BusinessDashboard] review insert event received');
        toast.success('¡Nueva reseña recibida!');
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
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const pastAppointments = appointments.filter(a => a.status === 'completed' || new Date(a.start_time) <= now);

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
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
  const confirmationRate = appointments.length > 0 ? (appointments.filter(a => a.status === 'confirmed').length / appointments.length) * 100 : 0;
  const cancellationRate = appointments.length > 0 ? (appointments.filter(a => a.status === 'cancelled').length / appointments.length) * 100 : 0;
  const avgDuration = completedAppointments.length > 0 ? completedAppointments.reduce((sum, a) => sum + (a.services?.duration ?? 0), 0) / completedAppointments.length : 0;
  const avgPrice = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;
  
  // More complex statistics calculations...
  const userAppointmentCounts: Record<string, number> = {};
  appointments.forEach(a => {
    userAppointmentCounts[a.user_id] = (userAppointmentCounts[a.user_id] || 0) + 1;
  });
  const serviceCounts: Record<string, number> = {};
  appointments.forEach(a => {
    const serviceName = a.services?.name ?? '';
    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
  });
  const [topServiceName, topServiceCount] = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const dayCounts: Record<number, number> = {};
  appointments.forEach(a => {
    const dayIndex = new Date(a.start_time).getDay();
    dayCounts[dayIndex] = (dayCounts[dayIndex] || 0) + 1;
  });
  const peakDayIndex = Number(Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0;
  const peakDayName = days[peakDayIndex] || '-';
  const peakHourCounts: Record<number, number> = {};
  appointments.forEach(a => {
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
    { id: 'settings', label: 'Configuración' }
  ];

  const appointmentTabs: Tab[] = [
    { id: 'pending', label: 'Pendientes', count: pendingAppointments.length },
    { id: 'confirmed', label: 'Confirmadas', count: confirmedAppointments.length },
    { id: 'history', label: 'Historial', count: pastAppointments.length }
  ];

  const settingsTabs: Tab[] = [
    { id: 'profile', label: 'Perfil' },
    { id: 'hours', label: 'Horarios' },
    { id: 'config', label: 'Ajustes' },
    { id: 'stats', label: 'Estadísticas' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto pt-6 pb-20 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            {businessData && (
              <Link to={`/${slugify(businessData.name)}`} className="flex items-center gap-4 group">
                <div className="relative">
                  <img
                    src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                    alt={`${businessData.name} logo`}
                    className="h-16 w-16 rounded-2xl object-cover shadow-lg border-2 border-white dark:border-slate-800 transition-transform group-hover:scale-105"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {businessData.name}
                  </h1>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Panel de Administración</p>
                </div>
              </Link>
            )}
            
            <Link 
              to="/dashboard" 
              className="inline-flex items-center justify-center px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              Volver a mi Perfil
            </Link>
          </div>

          <TabNav 
            tabs={tabs} 
            activeTabId={activeTab} 
            onTabChange={handleTabChange} 
          />

          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tab de Citas */}
            {activeTab === 'appointments' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader 
                    title="Gestión de Citas" 
                    description="Administra tus reservas activas y consulta el historial"
                  />
                  <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
                    <TabNav 
                      tabs={appointmentTabs} 
                      activeTabId={activeAppointmentTab} 
                      onTabChange={setActiveAppointmentTab} 
                    />
                  </div>
                </div>

                <div className="animate-in fade-in zoom-in-95 duration-300">
                  {activeAppointmentTab === 'pending' && (
                    <div className="space-y-6">
                      <BusinessAppointmentList
                        appointments={pagedPending}
                        onStatusChange={handleUpdateAppointmentStatus}
                        showReviewSection={false}
                      />
                      <Pagination 
                        currentPage={pagination.pending.page}
                        totalPages={Math.ceil(pendingAppointments.length / pagination.pending.perPage)}
                        onPageChange={(page) => handlePageChange('pending', page)}
                      />
                    </div>
                  )}

                  {activeAppointmentTab === 'confirmed' && (
                    <div className="space-y-6">
                      <BusinessAppointmentList
                        appointments={pagedConfirmed}
                        onStatusChange={handleUpdateAppointmentStatus}
                        showReviewSection={false}
                      />
                      <Pagination 
                        currentPage={pagination.confirmed.page}
                        totalPages={Math.ceil(confirmedAppointments.length / pagination.confirmed.perPage)}
                        onPageChange={(page) => handlePageChange('confirmed', page)}
                      />
                    </div>
                  )}

                  {activeAppointmentTab === 'history' && (
                    <div className="space-y-6">
                      <BusinessAppointmentList
                        appointments={pagedPast}
                        onStatusChange={handleUpdateAppointmentStatus}
                        showReviewSection={true}
                      />
                      <Pagination 
                        currentPage={pagination.history.page}
                        totalPages={Math.ceil(pastAppointments.length / pagination.history.perPage)}
                        onPageChange={(page) => handlePageChange('history', page)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab de Servicios */}
            {activeTab === 'services' && businessData && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <ServicesSection
                  businessId={businessData.id}
                  getServices={ApiClient.getBusinessServices}
                  createService={ApiClient.createBusinessService}
                  updateService={ApiClient.updateBusinessService}
                  deleteService={ApiClient.deleteBusinessService}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}

            {/* Tab de Clientes */}
            {activeTab === 'clients' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <ClientsSection
                  clients={pagedClients}
                  loading={loadingBusinessClients}
                  message={clientsMessage}
                />
                <Pagination 
                  currentPage={pagination.clients.page}
                  totalPages={Math.ceil(businessClients.length / pagination.clients.perPage)}
                  onPageChange={(page) => handlePageChange('clients', page)}
                />
              </div>
            )}

            {/* Tab de Configuración Unificada */}
            {activeTab === 'settings' && businessData && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader 
                    title="Configuración" 
                    description="Personaliza tu perfil, horarios y ajustes del negocio"
                  />
                  <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
                    <TabNav 
                      tabs={settingsTabs} 
                      activeTabId={activeSettingsTab} 
                      onTabChange={setActiveSettingsTab} 
                    />
                  </div>
                </div>

                <div className="animate-in fade-in zoom-in-95 duration-300">
                  {activeSettingsTab === 'profile' && (
                    <BusinessProfileSection
                      businessData={businessData}
                      onSave={handleBusinessSubmit}
                      onChange={handleBusinessChange}
                      saving={savingBusiness}
                      message={businessMessage}
                    />
                  )}

                  {activeSettingsTab === 'hours' && (
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

                  {activeSettingsTab === 'config' && (
                    <BusinessConfigSection
                      config={businessConfig}
                      loading={loadingBusinessConfig}
                      saving={savingBusinessConfig}
                      message={configMessage}
                      onSave={handleConfigSave}
                      onConfigChange={handleConfigChange}
                    />
                  )}

                  {activeSettingsTab === 'stats' && (
                    <StatsSection
                      totalAppointments={appointments.length}
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;