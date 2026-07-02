import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Business, getBusinessStats, getBusinessById, getBusinessServices, getUserBusinesses, updateAppointmentStatus, updateBusiness, deleteBusinessService, BusinessStats } from '../lib/api';
import { supabase } from '../lib/supabase';
import { AppointmentStatus } from '../types/appointment';
import { useBusinessAppointments } from '../hooks/useBusinessAppointments';
import { notifySuccess, notifyError } from '../lib/toast';
import { useUIConfig } from '../hooks/useUIConfig';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setBusinesses, updateBusinessInStore } from '../store/userSlice';
import { useBusinessConfig } from '../hooks/useBusinessConfig';
import { useBusinessHours } from '../hooks/useBusinessHours';
import { useBusinessClients } from '../hooks/useBusinessClients';
import { canAccessAnalytics, PLAN_BADGE } from '../lib/roles';
import type { RootState } from '../store';

import TabNav, { Tab } from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import StatsSection from '../components/business/StatsSection';
import ClientsSection from '../components/business/ClientsSection';
import BusinessProfileSection from '../components/business/BusinessProfileSection';
import BusinessConfigSection from '../components/business/BusinessConfigSection';
import BusinessHoursSection from '../components/business/BusinessHoursSection';
import ServicesSection from '../components/business/ServicesSection';
import BusinessSwitcher from '../components/business/BusinessSwitcher';
import BusinessProgressSection from '../components/business/BusinessProgressSection';
import BusinessQrCode from '../components/business/BusinessQrCode';
import BusinessAppointmentList from '../components/appointments/BusinessAppointmentList';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';

import SEO from '../components/SEO';
import {
  Store,
  CalendarCheck,
  CalendarClock,
  ArrowLeft,
  Clock,
} from 'lucide-react';

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const businesses = useSelector((state: RootState) => state.user.businesses);
  const plan = (userProfile?.plan as 'starter' | 'pro' | 'premium') || 'starter';
  const { itemsPerPage } = useUIConfig();
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
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
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

  const loadBusinessData = useCallback(async (businessId?: string) => {
    const id = businessId || userProfile?.business_id;
    if (!user?.id || !id) return;
    try {
      const response = await getBusinessById(id);
      if (response.success && response.data) {
        setBusinessData(response.data);
        const servicesResponse = await getBusinessServices(response.data.id);
        if (servicesResponse.success && servicesResponse.data) {
          setTotalServices(servicesResponse.data.length);
        }
        getBusinessStats(response.data.id).then(setBusinessStats).catch((err) => {
          console.error('[BusinessDashboard] Error fetching business stats:', err);
        });
      } else {
        setBusinessMessage({
          text: response.error || 'No se encontró información de tu negocio',
          type: 'error',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los datos del negocio';
      setBusinessMessage({ text: msg, type: 'error' });
      notifyError(msg);
    }
  }, [user?.id, userProfile?.business_id]);

  const dispatch = useAppDispatch();

  useEffect(() => {
    loadBusinessData();
  }, [loadBusinessData]);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'services') {
      setActiveTab('services');
    } else if (tabParam === 'profile') {
      setActiveTab('settings');
      setActiveSettingsTab('profile');
    } else if (tabParam === 'availability') {
      setActiveTab('settings');
      setActiveSettingsTab('hours');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) return;
    if (businesses.length === 0) {
      getUserBusinesses(user.id).then(res => {
        if (res.success && res.businesses && res.businesses.length > 0) {
          dispatch(setBusinesses(res.businesses));
        }
      });
    }
  }, [user?.id]);

  const handleBusinessSwitch = useCallback((newBusinessId: string) => {
    loadBusinessData(newBusinessId);
  }, [loadBusinessData]);

  useEffect(() => {
    const handleReviewEvent = (e: any) => {
      if (e.detail?.businessId === businessData?.id) {
        notifySuccess('¡Nueva reseña recibida!');
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
        notifySuccess('¡Nueva reseña recibida!');
        await refreshAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessData?.id, refreshAppointments]);

  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const response = await updateAppointmentStatus(id, newStatus);
      if (response.success) {
        const statusText =
          newStatus === 'confirmed' ? 'confirmada' :
          newStatus === 'completed' ? 'completada' :
          newStatus === 'cancelled' ? 'cancelada' : 'actualizada';
        notifySuccess(`Cita ${statusText} correctamente`);
        await refreshAppointments();
      } else {
        notifyError(response.error || 'Error al actualizar el estado de la cita');
      }
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al actualizar el estado de la cita');
    }
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setBusinessData(prev => prev ? ({ ...prev, [name]: val } as Business) : prev);
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessData) return;
    setSavingBusiness(true);
    setBusinessMessage(null);
    try {
      const response = await updateBusiness(businessData.id, {
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
        showcase_only: businessData.showcase_only ?? false,
      });
      setBusinessData(response);
      dispatch(updateBusinessInStore(response));
      setBusinessMessage({ text: 'Datos del negocio actualizados', type: 'success' });
      notifySuccess('Datos del negocio actualizados');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      setBusinessMessage({ text: msg, type: 'error' });
      notifyError(msg);
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

  const hasAnalytics = canAccessAnalytics(plan);
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const totalRevenue = hasAnalytics
    ? completedAppointments.reduce((sum, a) => sum + (a.services?.price ?? 0), 0) : 0;
  const confirmationRate = hasAnalytics && appointments.length > 0
    ? (appointments.filter(a => a.status === 'confirmed').length / appointments.length) * 100 : 0;
  const cancellationRate = hasAnalytics && appointments.length > 0
    ? (appointments.filter(a => a.status === 'cancelled').length / appointments.length) * 100 : 0;
  const avgDuration = hasAnalytics && completedAppointments.length > 0
    ? completedAppointments.reduce((sum, a) => sum + (a.services?.duration ?? 0), 0) / completedAppointments.length : 0;
  const avgPrice = hasAnalytics && completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

  const serviceCounts: Record<string, number> = {};
  if (hasAnalytics) {
    appointments.forEach(a => {
      const name = a.services?.name ?? '';
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
  }
  const [topServiceName, topServiceCount] = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

  const dayCounts: Record<number, number> = {};
  if (hasAnalytics) {
    appointments.forEach(a => {
      const idx = new Date(a.start_time).getDay();
      dayCounts[idx] = (dayCounts[idx] || 0) + 1;
    });
  }
  const peakDayIndex = Number(Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0;
  const peakDayName = days[peakDayIndex] || '-';

  const peakHourCounts: Record<number, number> = {};
  if (hasAnalytics) {
    appointments.forEach(a => {
      const h = new Date(a.start_time).getHours();
      peakHourCounts[h] = (peakHourCounts[h] || 0) + 1;
    });
  }
  const peakHour = Number(Object.entries(peakHourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0;
  const lifetimeValueAvg = hasAnalytics && businessClients.length > 0 ? totalRevenue / businessClients.length : 0;

  const canStats = canAccessAnalytics(plan);
  const planBadge = PLAN_BADGE[plan];

  const tabs: Tab[] = [
    { id: 'appointments', label: 'Citas', count: activeAppointmentsCount },
    { id: 'services', label: 'Servicios', count: totalServices },
    { id: 'clients', label: 'Clientes', count: businessClients.length },
    ...(canStats ? [{ id: 'stats' as const, label: 'Estadísticas' }] : []),
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <SEO title={businessData?.name ? `${businessData.name} — Panel` : 'Panel del negocio'} />
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 pt-4 sm:pt-6 space-y-5 sm:space-y-6">

          {/* ═══ HEADER ═══ */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Left: Business Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {businessData ? (
                    <Link to={`/${businessData.slug}`} className="flex items-center gap-3 group min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-lg transition-transform duration-300 group-hover:scale-105">
                          <img
                            src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                            alt={`${businessData.name} logo`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full shadow" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {businessData.name}
                          </h1>
                          {planBadge && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0 ${planBadge.className}`}>
                              {planBadge.text}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <Store className="w-3.5 h-3.5 shrink-0" />
                          Panel de Administración
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-40 animate-pulse" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {businesses.length > 0 && (
                    <BusinessSwitcher currentBusiness={businessData} onSwitch={handleBusinessSwitch} />
                  )}
                  {businessData && (
                    <BusinessQrCode businessSlug={businessData.slug!} businessName={businessData.name} />
                  )}
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mi Perfil</span>
                    <span className="sm:hidden">Perfil</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ PROGRESS ═══ */}
          {businessData && (
            <BusinessProgressSection businessData={businessData} />
          )}

          {/* ═══ TABS ═══ (outside space-y-8 to couple with Nav on scroll) */}
        </div>
        <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} sticky />
        <div className="px-4 sm:px-0 pt-4 pb-16 space-y-6">

          {/* ═══ CONTENT ═══ */}

            {/* ─── CITAS ─── */}
            {activeTab === 'appointments' && (
              <div className="space-y-5 p-2 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <SectionHeader title="Gestión de Citas" description="Administra tus reservas activas" />
                  <TabNav tabs={appointmentTabs} activeTabId={activeAppointmentTab} onTabChange={setActiveAppointmentTab} variant="pill" />
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
                  getServices={getBusinessServices}
                  deleteService={deleteBusinessService}
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

            {/* ─── ESTADÍSTICAS ─── */}
            {activeTab === 'stats' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <StatsSection
                  totalAppointments={appointments.length}
                  upcomingAppointments={confirmedAppointments.length}
                  pendingAppointments={pendingAppointments.length}
                  completedAppointments={completedAppointments.length}
                  totalClients={businessClients.length}
                  totalServices={totalServices}
                  plan={plan}
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
                  totalVisits={businessStats?.total_visits ?? 0}
                  visitsToday={businessStats?.visits_today ?? 0}
                  visitsWeek={businessStats?.visits_week ?? 0}
                  visitsMonth={businessStats?.visits_month ?? 0}
                  uniqueVisitors={businessStats?.unique_visitors ?? 0}
                  totalBusinessLikes={businessStats?.total_business_likes ?? 0}
                  totalServiceLikes={businessStats?.total_service_likes ?? 0}
                />
              </div>
            )}

            {/* ─── CONFIGURACIÓN ─── */}
            {activeTab === 'settings' && businessData && (
              <div className="space-y-5 p-2 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <SectionHeader title="Configuración" description="Perfil, horarios y comportamiento del negocio" />
                  <TabNav tabs={settingsTabs} activeTabId={activeSettingsTab} onTabChange={setActiveSettingsTab} variant="pill" />
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
                      plan={plan}
                      businessName={businessData?.name || ''}
                      businessAddress={businessData?.address || ''}
                      businessSlug={businessData?.slug || ''}
                      businessId={businessData?.id || ''}
                    />
                  )}
                </div>
              </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
