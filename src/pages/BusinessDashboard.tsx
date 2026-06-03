import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import { canAccessAdvancedAnalytics } from '../lib/roles';
import type { RootState } from '../store';

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
import EmptyState from '../components/ui/EmptyState';

import SEO from '../components/SEO';
import {
  Store,
  CalendarCheck,
  CalendarClock,
  Users,
  ArrowLeft,
  TrendingUp,
  Clock,
} from 'lucide-react';

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const plan = (userProfile?.plan as 'starter' | 'pro' | 'premium') || 'starter';
  const { itemsPerPage } = useUIConfig();
  const toast = useToast();
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [businessMessage, setBusinessMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingBusiness, setSavingBusiness] = useState(false);

  const { appointments, refreshAppointments } = useBusinessAppointments(businessData?.id || null);
  const { config: businessConfig, loading: loadingBusinessConfig, saving: savingBusinessConfig,
    message: configMessage, updateConfig: handleConfigChange, saveConfig: handleConfigSave } =
    useBusinessConfig(businessData?.id);
  const { businessHours, loading: loadingBusinessHours, saving: savingBusinessHours,
    message: hoursMessage, updateHour: handleHoursChange, saveHours: handleHoursSubmit } =
    useBusinessHours(businessData?.id);
  const { clients: businessClients, loading: loadingBusinessClients,
    message: clientsMessage } = useBusinessClients(businessData?.id);

  const [totalServices, setTotalServices] = useState(0);
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const [pagination, setPagination] = useState({
    pending: { page: 1, perPage: itemsPerPage },
    confirmed: { page: 1, perPage: itemsPerPage },
    history: { page: 1, perPage: itemsPerPage },
    clients: { page: 1, perPage: itemsPerPage },
  });

  const handlePageChange = (section: keyof typeof pagination, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage },
    }));
  };

  const activeAppointmentsCount = appointments.filter(a => a.status === 'pending').length +
    appointments.filter(a => a.status === 'confirmed').length;

  const [activeTab, setActiveTab] = useState('appointments');
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('pending');
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');

  useEffect(() => {
    if (activeSettingsTab === 'stats' && !canAccessAdvancedAnalytics(plan)) {
      setActiveSettingsTab('profile');
    }
  }, [plan, activeSettingsTab]);

  useEffect(() => {
    const loadBusinessData = async () => {
      if (!user?.id) return;
      try {
        const response = await ApiClient.getUserBusiness(user.id);
        if (response.success && response.data) {
          setBusinessData(response.data);
          const servicesResponse = await ApiClient.getBusinessServices(response.data.id);
          if (servicesResponse.success && servicesResponse.data) {
            setTotalServices(servicesResponse.data.length);
          }
        } else {
          setBusinessMessage({
            text: response.error || 'No se encontró información de tu negocio',
            type: 'error',
          });
        }
      } catch (err: any) {
        setBusinessMessage({ text: err.message || 'Error al cargar los datos del negocio', type: 'error' });
        toast.error(err.message || 'Error al cargar los datos del negocio');
      }
    };
    loadBusinessData();
  }, [user?.id]);

  useEffect(() => {
    const handleReviewEvent = (e: any) => {
      if (e.detail?.businessId === businessData?.id) {
        toast.success('¡Nueva reseña recibida!');
        refreshAppointments();
      }
    };
    window.addEventListener('businessReviewAdded', handleReviewEvent);
    return () => window.removeEventListener('businessReviewAdded', handleReviewEvent);
  }, [businessData?.id, refreshAppointments]);

  useEffect(() => {
    if (!businessData?.id) return;

    const channel = supabase
      .channel(`business-reviews-dashboard-${businessData.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agendaya_reviews',
        filter: `business_id=eq.${businessData.id}`,
      }, async () => {
        toast.success('¡Nueva reseña recibida!');
        await refreshAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessData?.id, refreshAppointments]);

  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const response = await ApiClient.updateAppointmentStatus(id, newStatus);
      if (response.success) {
        const statusText =
          newStatus === 'confirmed' ? 'confirmada' :
          newStatus === 'completed' ? 'completada' :
          newStatus === 'cancelled' ? 'cancelada' : 'actualizada';
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
        lng: businessData.lng,
      });
      if (response.success && response.data) {
        setBusinessData(response.data);
        setBusinessMessage({ text: 'Datos del negocio actualizados', type: 'success' });
        toast.success('Datos del negocio actualizados');
      } else {
        setBusinessMessage({ text: response.error || 'Error al actualizar', type: 'error' });
        toast.error(response.error || 'Error al actualizar');
      }
    } catch (err: any) {
      setBusinessMessage({ text: err.message || 'Error al actualizar', type: 'error' });
      toast.error(err.message || 'Error al actualizar');
    } finally {
      setSavingBusiness(false);
    }
  };

  const now = new Date();
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const pastAppointments = appointments.filter(a => a.status === 'completed' || new Date(a.start_time) <= now);

  const getPaginatedItems = <T extends any>(items: T[], section: keyof typeof pagination) => {
    const { page, perPage } = pagination[section];
    return items.slice((page - 1) * perPage, page * perPage);
  };

  const pagedPending = getPaginatedItems(pendingAppointments, 'pending');
  const pagedConfirmed = getPaginatedItems(confirmedAppointments, 'confirmed');
  const pagedPast = getPaginatedItems(pastAppointments, 'history');
  const pagedClients = getPaginatedItems(businessClients, 'clients');

  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
  const confirmationRate = appointments.length > 0
    ? (appointments.filter(a => a.status === 'confirmed').length / appointments.length) * 100 : 0;
  const cancellationRate = appointments.length > 0
    ? (appointments.filter(a => a.status === 'cancelled').length / appointments.length) * 100 : 0;
  const avgDuration = completedAppointments.length > 0
    ? completedAppointments.reduce((sum, a) => sum + (a.services?.duration ?? 0), 0) / completedAppointments.length : 0;
  const avgPrice = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

  const serviceCounts: Record<string, number> = {};
  appointments.forEach(a => {
    const name = a.services?.name ?? '';
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });
  const [topServiceName, topServiceCount] = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

  const dayCounts: Record<number, number> = {};
  appointments.forEach(a => {
    const idx = new Date(a.start_time).getDay();
    dayCounts[idx] = (dayCounts[idx] || 0) + 1;
  });
  const peakDayIndex = Number(Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0;
  const peakDayName = days[peakDayIndex] || '-';

  const peakHourCounts: Record<number, number> = {};
  appointments.forEach(a => {
    const h = new Date(a.start_time).getHours();
    peakHourCounts[h] = (peakHourCounts[h] || 0) + 1;
  });
  const peakHour = Number(Object.entries(peakHourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0;
  const lifetimeValueAvg = businessClients.length > 0 ? totalRevenue / businessClients.length : 0;

  const tabs: Tab[] = [
    { id: 'appointments', label: 'Citas', count: activeAppointmentsCount },
    { id: 'services', label: 'Servicios', count: totalServices },
    { id: 'clients', label: 'Clientes', count: businessClients.length },
    { id: 'settings', label: 'Configuración' },
  ];

  const appointmentTabs: Tab[] = [
    { id: 'pending', label: 'Pendientes', count: pendingAppointments.length },
    { id: 'confirmed', label: 'Confirmadas', count: confirmedAppointments.length },
    { id: 'history', label: 'Historial', count: pastAppointments.length },
  ];

  const settingsTabs: Tab[] = [
    { id: 'profile', label: 'Perfil' },
    { id: 'hours', label: 'Horarios' },
    { id: 'config', label: 'Ajustes' },
    ...(canAccessAdvancedAnalytics(plan) ? [{ id: 'stats' as const, label: 'Estadísticas' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO title={businessData?.name ? `${businessData.name} — Panel` : 'Panel del negocio'} />
      <div className="max-w-7xl mx-auto pt-6 pb-20 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-8">

          {/* ═══ HEADER ═══ */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5 group">
                {businessData ? (
                  <Link to={`/${businessData.slug || slugify(businessData.name)}`} className="flex items-center gap-5 group">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-xl transition-transform duration-300 group-hover:scale-105">
                        <img
                          src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                          alt={`${businessData.name} logo`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full shadow-lg" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {businessData.name}
                      </h1>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5" />
                        Panel de Administración
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 animate-pulse" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-32 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Mi Perfil
              </Link>
            </div>
          </div>

          {/* ═══ STATS ROW ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <StatCard
              icon={<CalendarClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
              label="Pendientes"
              value={pendingAppointments.length}
              color="bg-amber-50 dark:bg-amber-500/10"
            />
            <StatCard
              icon={<CalendarCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
              label="Confirmadas"
              value={confirmedAppointments.length}
              color="bg-emerald-50 dark:bg-emerald-500/10"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
              label="Completadas"
              value={completedAppointments.length}
              color="bg-primary-50 dark:bg-primary-500/10"
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-slate-600 dark:text-slate-400" />}
              label="Clientes"
              value={businessClients.length}
              color="bg-slate-100 dark:bg-slate-800"
            />
          </div>

          {/* ═══ TABS ═══ */}
          <div className="animate-in fade-in duration-500 delay-200">
            <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* ═══ CONTENT ═══ */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">

            {/* ─── CITAS ─── */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader title="Gestión de Citas" description="Administra tus reservas activas" />
                  <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
                    <TabNav tabs={appointmentTabs} activeTabId={activeAppointmentTab} onTabChange={setActiveAppointmentTab} />
                  </div>
                </div>

                <div className="animate-in fade-in zoom-in-95 duration-300">
                  {activeAppointmentTab === 'pending' && (
                    pendingAppointments.length === 0 ? (
                      <EmptyState
                        icon={<CalendarClock className="w-8 h-8" />}
                        title="Sin citas pendientes"
                        description="No hay solicitudes de reserva pendientes de confirmación."
                      />
                    ) : (
                      <div className="space-y-4">
                        <BusinessAppointmentList
                          appointments={pagedPending}
                          onStatusChange={handleUpdateAppointmentStatus}
                          showReviewSection={false}
                        />
                        {pendingAppointments.length > pagination.pending.perPage && (
                          <Pagination
                            currentPage={pagination.pending.page}
                            totalPages={Math.ceil(pendingAppointments.length / pagination.pending.perPage)}
                            onPageChange={(page) => handlePageChange('pending', page)}
                          />
                        )}
                      </div>
                    )
                  )}

                  {activeAppointmentTab === 'confirmed' && (
                    confirmedAppointments.length === 0 ? (
                      <EmptyState
                        icon={<CalendarCheck className="w-8 h-8" />}
                        title="Sin citas confirmadas"
                        description="Las citas confirmadas aparecerán aquí."
                      />
                    ) : (
                      <div className="space-y-4">
                        <BusinessAppointmentList
                          appointments={pagedConfirmed}
                          onStatusChange={handleUpdateAppointmentStatus}
                          showReviewSection={false}
                        />
                        {confirmedAppointments.length > pagination.confirmed.perPage && (
                          <Pagination
                            currentPage={pagination.confirmed.page}
                            totalPages={Math.ceil(confirmedAppointments.length / pagination.confirmed.perPage)}
                            onPageChange={(page) => handlePageChange('confirmed', page)}
                          />
                        )}
                      </div>
                    )
                  )}

                  {activeAppointmentTab === 'history' && (
                    pastAppointments.length === 0 ? (
                      <EmptyState
                        icon={<Clock className="w-8 h-8" />}
                        title="Historial vacío"
                        description="Las citas completadas o canceladas aparecerán aquí."
                      />
                    ) : (
                      <div className="space-y-4">
                        <BusinessAppointmentList
                          appointments={pagedPast}
                          onStatusChange={handleUpdateAppointmentStatus}
                          showReviewSection={true}
                        />
                        {pastAppointments.length > pagination.history.perPage && (
                          <Pagination
                            currentPage={pagination.history.page}
                            totalPages={Math.ceil(pastAppointments.length / pagination.history.perPage)}
                            onPageChange={(page) => handlePageChange('history', page)}
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ─── SERVICIOS ─── */}
            {activeTab === 'services' && businessData && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <ServicesSection
                  businessId={businessData.id}
                  getServices={ApiClient.getBusinessServices}
                  createService={ApiClient.createBusinessService}
                  updateService={ApiClient.updateBusinessService}
                  deleteService={ApiClient.deleteBusinessService}
                  itemsPerPage={itemsPerPage}
                  plan={plan}
                />
              </div>
            )}

            {/* ─── CLIENTES ─── */}
            {activeTab === 'clients' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <ClientsSection
                  clients={pagedClients}
                  loading={loadingBusinessClients}
                  message={clientsMessage}
                />
                {businessClients.length > pagination.clients.perPage && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.clients.page}
                      totalPages={Math.ceil(businessClients.length / pagination.clients.perPage)}
                      onPageChange={(page) => handlePageChange('clients', page)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── CONFIGURACIÓN ─── */}
            {activeTab === 'settings' && businessData && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader title="Configuración" description="Perfil, horarios, ajustes y estadísticas del negocio" />
                  <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
                    <TabNav tabs={settingsTabs} activeTabId={activeSettingsTab} onTabChange={setActiveSettingsTab} />
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
