import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { dispatchUserProfileUpdated } from '../lib/events';
import UserProfileSection from '../components/profile/UserProfileSection';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setUserProfile } from '../store/userSlice';
import { useAppointments } from '../hooks/useAppointments';
import type { UserProfile } from '../lib/supabase';
import type { RootState } from '../store';
import { getUserBusinesses, updateUserProfile } from '../lib/api';
import { notifySuccess, notifyError } from '../lib/toast';
import { useUIConfig } from '../hooks/useUIConfig';
import UserAppointmentList from '../components/appointments/UserAppointmentList';
import FavoritesSection from '../components/profile/FavoritesSection';
import ReferralSection from '../components/profile/ReferralSection';
import type { Appointment } from '../types/appointment';
import CancelRescheduleModal from '../components/appointments/CancelRescheduleModal';
import TabNav from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import {
  CalendarCheck,
  CalendarClock,
  Clock,
  Store,
  Star,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  ListChecks,
  Plus,
  UserPlus,
} from 'lucide-react';
import { ROLE_LABELS, PLAN_BADGE, PLAN_LABELS, getMaxBusinesses } from '../lib/roles';
import { updateProfileRole } from '../lib/api';
import VisitStreaks from '../components/business/VisitStreaks';

const FALLBACK_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

interface ProfileDashboardProps {
  user: UserProfile | null;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-48" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-lg w-64" />
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-24" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
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

const ProfileDashboard = ({ user }: ProfileDashboardProps) => {
  const dispatch = useAppDispatch();
  const { itemsPerPage, saveItemsPerPage } = useUIConfig();
  const navigate = useNavigate();

  const { appointments, loading: appointmentsLoading } = useAppointments(user?.id);

  const avatarUrl = useMemo(() => {
    if (!user?.avatar_url) return FALLBACK_AVATAR;
    return user.avatar_url.startsWith('http')
      ? user.avatar_url
      : supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl;
  }, [user?.avatar_url]);

  const businesses = useSelector((state: RootState) => state.user.businesses);
  const [hasBusiness, setHasBusiness] = useState(false);
  const plan = (user?.plan || 'starter') as 'starter' | 'pro' | 'premium';
  const canCreateMore = hasBusiness && businesses.length < getMaxBusinesses(plan) && plan !== 'starter';

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [itemsPerPageMessage, setItemsPerPageMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [pagination, setPagination] = useState({
    upcoming: { page: 1, perPage: itemsPerPage },
    pending: { page: 1, perPage: itemsPerPage },
    history: { page: 1, perPage: itemsPerPage },
  });

  const isVisitor = user?.role === 'visitor';

  const handleActivateClient = async () => {
    if (!user?.id) return;
    const result = await updateProfileRole(user.id, 'client');
    if (result.success) {
      const updated = { ...user, role: 'client' } as UserProfile;
      dispatch(setUserProfile(updated));
      notifySuccess('¡Cuenta de cliente activada! Ya puedes agendar citas.');
    } else {
      notifyError(result.error || 'Error al activar cuenta de cliente');
    }
  };

  const [activeTab, setActiveTab] = useState<'appointments' | 'favorites' | 'stats' | 'settings' | 'referrals'>('appointments');
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('upcoming');
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState<Appointment | null>(null);

  const confirmedAppointments = useMemo(
    () => appointments.filter(a => a.status === 'confirmed'),
    [appointments]
  );
  const pendingAppointments = useMemo(
    () => appointments.filter(a => a.status === 'pending'),
    [appointments]
  );
  const pastAppointments = useMemo(
    () => appointments.filter(a =>
      a.status === 'completed' ||
      a.status === 'cancelled' ||
      (new Date(a.start_time) < new Date() && !['pending', 'confirmed'].includes(a.status))
    ),
    [appointments]
  );

  const upcomingCount = confirmedAppointments.length;
  const pendingCount = pendingAppointments.length;
  const pastCount = pastAppointments.length;
  const activeAppointmentsCount = upcomingCount + pendingCount;

  const handlePageChange = useCallback((section: keyof typeof pagination, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage },
    }));
  }, []);

  const getPaginatedItems = useCallback((items: Appointment[], page: number, perPage: number) => {
    return items.slice((page - 1) * perPage, page * perPage);
  }, []);

  const pagedUpcoming = getPaginatedItems(confirmedAppointments, pagination.upcoming.page, pagination.upcoming.perPage);
  const pagedPending = getPaginatedItems(pendingAppointments, pagination.pending.page, pagination.pending.perPage);
  const paginatedPastAppointments = getPaginatedItems(pastAppointments, pagination.history.page, pagination.history.perPage);

  useEffect(() => {
    const checkBusiness = async () => {
      if (!user) return;
      try {
        const response = await getUserBusinesses(user.id);
        setHasBusiness(!!(response.success && response.businesses && response.businesses.length > 0));
      } catch {
        setHasBusiness(false);
      }
    };
    checkBusiness();
  }, [user]);

  useEffect(() => {
    setProfileData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar_url: user?.avatar_url || '',
    });
  }, [user]);

  const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleProfileSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setProfileMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No se pudo obtener la sesión');

      const response = await updateUserProfile(user.id, {
        full_name: profileData.full_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url || undefined,
        updated_at: new Date().toISOString(),
      });

      if (response.success && response.data) {
        setProfileData(prev => ({ ...prev, ...response.data }));
        dispatchUserProfileUpdated(session.user, response.data);
        setProfileMessage({ text: 'Perfil actualizado correctamente', type: 'success' });
        notifySuccess('Perfil actualizado correctamente');
      } else {
        throw new Error(response.error || 'Error al actualizar perfil');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Error al actualizar perfil';
      setProfileMessage({ text: errorMsg, type: 'error' });
      notifyError(errorMsg);
    } finally {
      setSaving(false);
    }
  }, [user, profileData]);

  const handleReschedule = useCallback((appointment: Appointment) => {
    setSelectedAppointmentForCancel(appointment);
  }, []);

  const handleCancel = useCallback((appointment: Appointment) => {
    setSelectedAppointmentForCancel(appointment);
  }, []);

  const handleReview = useCallback((appointment: Appointment) => {
    navigate(`/review/${appointment.id}`);
  }, [navigate]);

  const handleItemsPerPageChange = useCallback((value: number) => {
    if (value >= 1 && value <= 50) {
      dispatch({ type: 'ui/setItemsPerPage', payload: value });
    }
  }, [dispatch]);

  const handleSaveItemsPerPage = useCallback(async () => {
    if (!user) return;
    setItemsPerPageMessage(null);
    const success = await saveItemsPerPage(user.id);
    setItemsPerPageMessage({
      text: success ? 'Configuración guardada' : 'Error al guardar la configuración',
      type: success ? 'success' : 'error',
    });
  }, [user, saveItemsPerPage]);

  const tabs = [
    { id: 'appointments', label: 'Mis Citas', count: activeAppointmentsCount },
    { id: 'favorites', label: 'Favoritos' },
    { id: 'referrals', label: 'Referidos' },
    { id: 'stats', label: 'Estadísticas' },
    { id: 'settings', label: 'Configuración' },
  ];

  const appointmentTabs = [
    { id: 'upcoming', label: 'Próximas', count: upcomingCount },
    { id: 'pending', label: 'Pendientes', count: pendingCount },
    { id: 'history', label: 'Historial', count: pastCount },
  ];

  const settingsTabs = [
    { id: 'profile', label: 'Perfil' },
    { id: 'general', label: 'Ajustes' },
  ];

  const username = user?.full_name?.split(' ')[0] || 'Usuario';
  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 pt-6 space-y-8">

          {/* ─── HEADER ─── */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5 group">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-xl transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={avatarUrl}
                      alt={`${username} avatar`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full shadow-lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {greeting}, {username}
                    </h1>
                    <span className="text-lg">{greeting.includes('noches') ? '🌙' : greeting.includes('tardes') ? '☀️' : '🌅'}</span>
                    {user?.role && user.role !== 'visitor' && (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                      </span>
                    )}
                    {user?.plan && (() => {
                      const p = user.plan as 'starter' | 'pro' | 'premium';
                      const badge = PLAN_BADGE[p];
                      return badge ? (
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${badge.className}`}>
                          {PLAN_LABELS[p]}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeAppointmentsCount > 0
                      ? `Tienes ${activeAppointmentsCount} ${activeAppointmentsCount === 1 ? 'cita activa' : 'citas activas'} hoy`
                      : 'Gestiona tus citas y configura tu perfil'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isVisitor ? (
                  <button
                    onClick={handleActivateClient}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Activar cuenta de cliente
                  </button>
                ) : null}
                {hasBusiness ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Link
                      to="/business/dashboard"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Store className="w-4 h-4" />
                      Mi Negocio
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    {canCreateMore && (
                      <Link
                        to="/business/register"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 text-sm font-bold rounded-xl border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Plus className="w-4 h-4" />
                        Crear otro negocio
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/business/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 text-sm font-bold rounded-xl border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Store className="w-4 h-4" />
                    Registrar mi negocio
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ─── VISITOR UPGRADE BANNER ─── */}
          {isVisitor && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                    Activa tu cuenta de cliente
                  </h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    Agenda citas, escribe reseñas, guarda tus favoritos y mucho más. Es gratis.
                  </p>
                </div>
                <button
                  onClick={handleActivateClient}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Activar ahora
                </button>
              </div>
            </div>
          )}

          {/* ─── MAIN TABS ─── (outside space-y-8 to couple with Nav) */}
        </div>
        <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={(tab) => setActiveTab(tab as 'appointments' | 'favorites' | 'stats' | 'settings' | 'referrals')} sticky />
        <div className="px-4 sm:px-0 pt-4 pb-20 space-y-8">

          {/* ═══ CITAS TAB ═══ */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader
                    title="Mis Reservas"
                    description="Gestiona tus citas y revisa tu historial"
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
                  {/* Próximas */}
                  {activeAppointmentTab === 'upcoming' && (
                    appointmentsLoading ? (
                      <div className="space-y-4">
                        <SkeletonCard />
                        <SkeletonCard />
                      </div>
                    ) : pagedUpcoming.length === 0 ? (
                      <EmptyState
                        icon={<CalendarCheck className="w-8 h-8" />}
                        title="No tienes citas próximas"
                        description="Aún no has agendado ninguna cita. Explora los negocios disponibles y reserva tu primera cita."
                        action={{ label: 'Explorar negocios', to: '/explore' }}
                      />
                    ) : (
                      <div className="space-y-4">
                        <UserAppointmentList
                          appointments={pagedUpcoming}
                          onReschedule={handleReschedule}
                          onCancel={handleCancel}
                        />
                        {confirmedAppointments.length > pagination.upcoming.perPage && (
                          <Pagination
                            currentPage={pagination.upcoming.page}
                            totalPages={Math.ceil(confirmedAppointments.length / pagination.upcoming.perPage)}
                            onPageChange={(page) => handlePageChange('upcoming', page)}
                          />
                        )}
                      </div>
                    )
                  )}

                  {/* Pendientes */}
                  {activeAppointmentTab === 'pending' && (
                    appointmentsLoading ? (
                      <div className="space-y-4">
                        <SkeletonCard />
                      </div>
                    ) : pagedPending.length === 0 ? (
                      <EmptyState
                        icon={<CalendarClock className="w-8 h-8" />}
                        title="Sin citas pendientes"
                        description="No tienes solicitudes de cita pendientes. Cuando reserves un servicio, aparecerá aquí hasta que el negocio lo confirme."
                      />
                    ) : (
                      <div className="space-y-4">
                        <UserAppointmentList
                          appointments={pagedPending}
                          onReschedule={handleReschedule}
                          onCancel={handleCancel}
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

                  {/* Historial */}
                  {activeAppointmentTab === 'history' && (
                    appointmentsLoading ? (
                      <div className="space-y-4">
                        <SkeletonCard />
                        <SkeletonCard />
                      </div>
                    ) : paginatedPastAppointments.length === 0 ? (
                      <EmptyState
                        icon={<Clock className="w-8 h-8" />}
                        title="Historial vacío"
                        description="Aún no has completado ninguna cita. Una vez que tengas citas pasadas, aparecerán aquí."
                      />
                    ) : (
                      <div className="space-y-4">
                        <UserAppointmentList
                          appointments={paginatedPastAppointments}
                          onReschedule={handleReschedule}
                          onReview={handleReview}
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

            {/* ═══ FAVORITES TAB ═══ */}
            {activeTab === 'favorites' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                {user && <FavoritesSection user={user} />}
              </div>
            )}

            {/* ═══ REFERRALS TAB ═══ */}
            {activeTab === 'referrals' && user && (
              <ReferralSection userId={user.id} />
            )}

            {/* ═══ STATS TAB ═══ */}
            {activeTab === 'stats' && (
              <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                {user && appointments.length > 0 && (
                  <VisitStreaks userId={user.id} businessId={appointments.filter(a => a.businesses?.name).reduce((acc, a) => {
                    if (!acc.find(x => x.id === a.business_id)) acc.push({ id: a.business_id, name: a.businesses?.name || '' });
                    return acc;
                  }, [] as { id: string; name: string }[])[0]?.id || ''} />
                )}
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Estadísticas de tus citas</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Resumen de tu actividad como cliente
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard
                    icon={<CalendarCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
                    label="Confirmadas"
                    value={upcomingCount}
                    color="bg-emerald-50 dark:bg-emerald-500/10"
                  />
                  <StatCard
                    icon={<CalendarClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                    label="Pendientes"
                    value={pendingCount}
                    color="bg-amber-50 dark:bg-amber-500/10"
                  />
                  <StatCard
                    icon={<Star className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
                    label="Completadas"
                    value={pastAppointments.filter(a => a.status === 'completed').length}
                    color="bg-primary-50 dark:bg-primary-500/10"
                  />
                  <StatCard
                    icon={<ListChecks className="w-6 h-6 text-slate-600 dark:text-slate-400" />}
                    label="Total"
                    value={appointments.length}
                    color="bg-slate-100 dark:bg-slate-800"
                  />
                </div>

                {appointments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tasa de Finalización</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        {Math.round((pastAppointments.filter(a => a.status === 'completed').length / appointments.length) * 100)}%
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Canceladas</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        {appointments.filter(a => a.status === 'cancelled').length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Negocios Visitados</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        {new Set(appointments.map(a => a.business_id)).size}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ SETTINGS TAB ═══ */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader
                    title="Configuración"
                    description="Actualiza tu perfil y preferencias"
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
                    <UserProfileSection
                      profileData={profileData}
                      onChange={handleProfileChange}
                      onSave={handleProfileSubmit}
                      saving={saving}
                      message={profileMessage}
                    />
                  )}

                  {activeSettingsTab === 'general' && (
                    <div className="space-y-4">
                      {/* Preferencias */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                            <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Preferencias</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Personaliza tu experiencia</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                            Registros por página
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={itemsPerPage}
                              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value) || 1)}
                              className="w-24 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold text-center"
                            />
                            <button
                              onClick={handleSaveItemsPerPage}
                              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-95"
                            >
                              Guardar
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Ajusta cuántos elementos ver por página en tus listados.
                          </p>
                        </div>

                        {itemsPerPageMessage && (
                          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${
                            itemsPerPageMessage.type === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}>
                            {itemsPerPageMessage.text}
                          </div>
                        )}
                      </div>

                      {/* Cuenta */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Cuenta</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Seguridad y sesión</p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            const { error } = await supabase.auth.signOut();
                            if (!error) navigate('/');
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition-all active:scale-95"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

        </div>
      </div>

      <CancelRescheduleModal
        isOpen={!!selectedAppointmentForCancel}
        onClose={() => setSelectedAppointmentForCancel(null)}
        appointment={selectedAppointmentForCancel}
      />

    </div>
  );
};

export default ProfileDashboard;
