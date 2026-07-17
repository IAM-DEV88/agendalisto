import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Business, getBusinessStats, getBusinessById, getBusinessServices, getUserBusinesses, updateAppointmentStatus, rescheduleAppointment, updateBusiness, deleteBusinessService, BusinessStats } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Appointment, AppointmentStatus } from '../types/appointment';
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
import { useSwipeable } from '../hooks/useSwipeable';

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
import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import CancelRescheduleModal from '../components/appointments/CancelRescheduleModal';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';

import SEO from '../components/SEO';
import {
  Store,
  CalendarCheck,
  CalendarClock,
  ArrowLeft,
  Clock,
  Settings,
  Timer,
  CheckCircle2,
  AlertCircle,
  Save,
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
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
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
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('calendar');
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [activeActivasTab, setActiveActivasTab] = useState('pending');
  const contentRef = useRef<HTMLDivElement>(null);

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
    } else if (tabParam === 'hours' || tabParam === 'availability') {
      setActiveTab('hours');
    } else if (tabParam === 'profile') {
      setActiveTab('settings');
      setActiveSettingsTab('profile');
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

  const handleReschedule = async (id: string, startTime: string, endTime: string) => {
    const result = await rescheduleAppointment(id, startTime, endTime);
    if (result.success) {
      notifySuccess('Cita reprogramada correctamente');
      await refreshAppointments();
    } else {
      notifyError(result.error || 'Error al reprogramar la cita');
    }
    return result;
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

  useSwipeable(contentRef, {
    onSwipeLeft: () => {
      const idx = tabs.findIndex(t => t.id === activeTab);
      if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
    },
    onSwipeRight: () => {
      const idx = tabs.findIndex(t => t.id === activeTab);
      if (idx > 0) setActiveTab(tabs[idx - 1].id);
    },
  });

  const tabs: Tab[] = [
    { id: 'appointments', label: 'Citas', count: activeAppointmentsCount },
    { id: 'services', label: 'Servicios', count: totalServices },
    { id: 'hours', label: 'Horarios' },
    ...(canStats ? [{ id: 'stats' as const, label: 'Estadísticas' }] : []),
  ];

  const appointmentTabs: Tab[] = [
    { id: 'calendar', label: 'Calendario' },
    { id: 'activas', label: 'Activas', count: activeAppointmentsCount },
    { id: 'history', label: 'Historial', count: pastAppointments.length },
    { id: 'clients', label: 'Clientes', count: businessClients.length },
  ];

  const settingsTabs: Tab[] = [
    { id: 'profile', label: 'Perfil' },
    { id: 'operation', label: 'Operación' },
    { id: 'config', label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200 overflow-x-clip">
      <SEO title={businessData?.name ? `${businessData.name} — Panel` : 'Panel del negocio'} />
      <div className="max-w-7xl mx-auto px-4">
        <div className="py-4 space-y-5 sm:space-y-6">

          {/* ═══ HEADER ═══ */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Left: Business Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {businessData ? (
                    <Link to={`/${businessData.slug}`} className="flex items-center gap-3 group min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div className="h-16 w-16 sm:h-14 sm:w-14 rounded-lg overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-lg transition-transform duration-300 group-hover:scale-105">
                          <img
                            src={businessData.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                            alt={`${businessData.name} logo`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full shadow" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-0">
                          {businessData.name}
                        </h1>

                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate mb-0">
                          <Store className="w-3.5 h-3.5 shrink-0" />
                          Panel de Administración
                        </p>
                        <div>
                          {planBadge && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0 ${planBadge.className}`}>
                              {planBadge.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-40 animate-pulse" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {businesses.length > 0 && (
                      <div className="flex-1 min-w-0 sm:flex-none">
                        <BusinessSwitcher currentBusiness={businessData} onSwitch={handleBusinessSwitch} />
                      </div>
                    )}
                    {businessData && (
                      <BusinessQrCode businessSlug={businessData.slug!} businessName={businessData.name} />
                    )}
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center justify-center w-9 h-9 p-0 bg-white dark:bg-slate-900 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 active:scale-95 transition-all shadow-sm shrink-0"
                      title="Configuración"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm w-full sm:w-auto"
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
        <div ref={contentRef} className="py-4 md:pt-8 pt-8 pb-16 space-y-6">

          {/* ═══ CONTENT ═══ */}

          {/* ─── CITAS ─── */}
          {activeTab === 'appointments' && (
            <div>
              <div className="mb-4 md:mb-6">
                <SectionHeader title="Gestión de Citas" description="Administra reservas, consulta el historial y gestiona tus clientes" />
              </div>

              <TabNav tabs={appointmentTabs} activeTabId={activeAppointmentTab} onTabChange={setActiveAppointmentTab} variant="pill" sticky connected />

              <div className="bg-white dark:bg-slate-900 rounded-b-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6 -mt-px">
                <div className="animate-in fade-in zoom-in-95 duration-300">
                {activeAppointmentTab === 'activas' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveActivasTab('pending')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeActivasTab === 'pending'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        Pendientes ({pendingAppointments.length})
                      </button>
                      <button
                        onClick={() => setActiveActivasTab('confirmed')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeActivasTab === 'confirmed'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        Confirmadas ({confirmedAppointments.length})
                      </button>
                    </div>
                    {activeActivasTab === 'pending' && (
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
                            onReschedule={(appt) => setAppointmentToReschedule(appt)}
                            showReviewSection={false}
                            indexOffset={(pagination.pending.page - 1) * pagination.pending.perPage}
                            currentUserId={user?.id}
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
                    {activeActivasTab === 'confirmed' && (
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
                            onReschedule={(appt) => setAppointmentToReschedule(appt)}
                            showReviewSection={false}
                            indexOffset={(pagination.confirmed.page - 1) * pagination.confirmed.perPage}
                            currentUserId={user?.id}
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
                  </div>
                )}

                {activeAppointmentTab === 'calendar' && (
                  <AppointmentCalendar
                    appointments={appointments}
                    onStatusChange={handleUpdateAppointmentStatus}
                    onReschedule={handleReschedule}
                    onCancel={(appt) => setAppointmentToReschedule(appt)}
                    isOwner
                    businessHours={businessHours}
                    currentUserId={user?.id}
                  />
                )}

                {activeAppointmentTab === 'clients' && (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <ClientsSection
                      clients={pagedClients}
                      loading={loadingBusinessClients}
                      message={clientsMessage}
                      appointments={appointments}
                      indexOffset={(pagination.clients.page - 1) * pagination.clients.perPage}
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
                        onReschedule={(appt) => setAppointmentToReschedule(appt)}
                        showReviewSection={true}
                        indexOffset={(pagination.history.page - 1) * pagination.history.perPage}
                        currentUserId={user?.id}
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

          {/* ─── HORARIOS ─── */}
          {activeTab === 'hours' && businessData && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <BusinessHoursSection
                businessHours={businessHours}
                loading={loadingBusinessHours}
                saving={savingBusinessHours}
                message={hoursMessage}
                onSave={handleHoursSubmit}
                onHoursChange={handleHoursChange}
                days={days}
                businessId={businessData?.id}
                plan={plan}
                passwordProtectionEnabled={businessConfig?.password_protection_enabled}
                passwordProtectStaff={businessConfig?.password_protect_staff}
              />
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
            <div>
              <div className="mb-4 md:mb-6">
                <SectionHeader title="Configuración" description="Perfil y comportamiento de la página" />
              </div>

              <TabNav tabs={settingsTabs} activeTabId={activeSettingsTab} onTabChange={setActiveSettingsTab} variant="pill" sticky connected />

              <div className="bg-white dark:bg-slate-900 rounded-b-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6 -mt-px">
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

                {activeSettingsTab === 'operation' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Horarios de Reserva</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="slot_interval_minutes" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            Intervalo de slots
                          </label>
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-slate-400" />
                            <select id="slot_interval_minutes" value={businessConfig?.slot_interval_minutes ?? 30}
                              onChange={(e) => handleConfigChange('slot_interval_minutes', parseInt(e.target.value))}
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value={15}>15 minutos</option>
                              <option value={30}>30 minutos</option>
                              <option value={60}>1 hora</option>
                            </select>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cada cuánto tiempo se muestran los horarios disponibles.</p>
                        </div>
                        <div>
                          <label htmlFor="buffer_minutes" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            Tiempo de buffer
                          </label>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <select id="buffer_minutes" value={businessConfig?.buffer_minutes ?? 0}
                              onChange={(e) => handleConfigChange('buffer_minutes', parseInt(e.target.value))}
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value={0}>Sin buffer</option>
                              <option value={5}>5 minutos</option>
                              <option value={10}>10 minutos</option>
                              <option value={15}>15 minutos</option>
                              <option value={30}>30 minutos</option>
                            </select>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tiempo libre entre citas para preparación.</p>
                        </div>
                        <div>
                          <label htmlFor="max_advance_booking_days" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            Reservar con anticipación
                          </label>
                          <div className="flex items-center gap-2">
                            <CalendarClock className="w-4 h-4 text-slate-400" />
                            <select id="max_advance_booking_days" value={businessConfig?.max_advance_booking_days ?? 90}
                              onChange={(e) => handleConfigChange('max_advance_booking_days', parseInt(e.target.value))}
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value={7}>7 días</option>
                              <option value={14}>14 días</option>
                              <option value={30}>30 días</option>
                              <option value={60}>60 días</option>
                              <option value={90}>90 días</option>
                              <option value={180}>180 días</option>
                              <option value={365}>1 año</option>
                            </select>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cuántos días adelante los clientes pueden reservar.</p>
                        </div>
                      </div>
                    </div>

                    {configMessage && (
                      <div className={`alert ${configMessage.type === 'success' ? 'alert-success' : 'alert-error'} flex items-center gap-3`}>
                        {configMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="font-bold">{configMessage.text}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button type="button" onClick={handleConfigSave}
                        className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 gap-2 disabled:opacity-50"
                      >
                        <Save className="w-5 h-5" />
                        Guardar
                      </button>
                    </div>
                  </div>
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
            </div>
          )}

        </div>
      </div>

      <CancelRescheduleModal
        key={appointmentToReschedule?.id || 'none'}
        isOpen={!!appointmentToReschedule}
        onClose={() => setAppointmentToReschedule(null)}
        appointment={appointmentToReschedule}
        isOwner
      />
    </div>
  );
};

export default BusinessDashboard;
