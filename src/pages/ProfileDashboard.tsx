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
import { ApiClient } from '../lib/apiClient';
import { useToast } from '../hooks/useToast';
import { toast } from 'react-hot-toast';
import { useUIConfig } from '../hooks/useUIConfig';
import UserAppointmentList from '../components/appointments/UserAppointmentList';
import FavoritesSection from '../components/profile/FavoritesSection';
import type { Appointment } from '../types/appointment';
import ReviewModal from '../components/appointments/ReviewModal';
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
  UserPlus,
  Plus,
  Link as LinkIcon,
  Copy,
  Share2,
  Gift,
  Calendar,
  Mail,
  User,
} from 'lucide-react';
import { ROLE_LABELS, PLAN_BADGE, PLAN_LABELS, getMaxBusinesses } from '../lib/roles';
import { updateProfileRole, getReferralLink, getReferralCount, getReferredUsers, ReferredUser } from '../lib/api';
import VisitStreaks from '../components/business/VisitStreaks';

const FALLBACK_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

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
  const toast = useToast();
  const navigate = useNavigate();

  const { appointments, refreshAppointments, loading: appointmentsLoading } = useAppointments(user?.id);

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
      toast.success('¡Cuenta de cliente activada! Ya puedes agendar citas.');
    } else {
      toast.error(result.error || 'Error al activar cuenta de cliente');
    }
  };

  const [activeTab, setActiveTab] = useState<'appointments' | 'favorites' | 'stats' | 'settings' | 'referrals'>('appointments');
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('upcoming');
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<Appointment | null>(null);

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
        const response = await ApiClient.getUserBusinesses(user.id);
        setHasBusiness(!!(response.success && response.data && response.data.length > 0));
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

      const response = await ApiClient.updateUserProfile(user.id, {
        full_name: profileData.full_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url || undefined,
        updated_at: new Date().toISOString(),
      });

      if (response.success && response.data) {
        setProfileData(prev => ({ ...prev, ...response.data }));
        dispatchUserProfileUpdated(session.user, response.data);
        setProfileMessage({ text: 'Perfil actualizado correctamente', type: 'success' });
        toast.success('Perfil actualizado correctamente');
      } else {
        throw new Error(response.error || 'Error al actualizar perfil');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Error al actualizar perfil';
      setProfileMessage({ text: errorMsg, type: 'error' });
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }, [user, profileData, toast]);

  const handleReschedule = useCallback((appointment: Appointment) => {
    const businessName = appointment.businesses?.name;
    if (!businessName) return;
    const slug = slugify(businessName);
    navigate(`/${slug}?reschedule=true&serviceId=${appointment.service_id}&date=${encodeURIComponent(appointment.start_time)}`);
  }, [navigate]);

  const handleCancel = useCallback(async (appointment: Appointment) => {
    if (!user) return;
    try {
      const response = await ApiClient.updateAppointmentStatus(appointment.id, 'cancelled');
      if (!response.success) {
        toast.error(response.error || 'Error al cancelar la cita');
      } else {
        toast.success('Cita cancelada correctamente');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar la cita');
    }
  }, [user, toast]);

  const handleReview = useCallback((appointment: Appointment) => {
    setSelectedAppointmentForReview(appointment);
  }, []);

  const handleReviewSubmit = useCallback(async (rating: number, comment: string, beforeImage?: string, afterImage?: string) => {
    if (!user || !selectedAppointmentForReview) return;

    try {
      const response = await ApiClient.createBusinessReview(
        selectedAppointmentForReview.id,
        selectedAppointmentForReview.business_id,
        user.id,
        rating,
        comment,
        beforeImage,
        afterImage,
      );
      if (response.success) {
        toast.success('Reseña enviada — pendiente de aprobación por un moderador');
        await refreshAppointments();
        window.dispatchEvent(new CustomEvent('businessReviewAdded', {
          detail: { businessId: selectedAppointmentForReview.business_id },
        }));
        setSelectedAppointmentForReview(null);
      } else {
        toast.error(response.error || 'Error al enviar la reseña');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la reseña');
    }
  }, [user, selectedAppointmentForReview, toast, refreshAppointments]);

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
      <div className="max-w-7xl mx-auto pt-6 pb-20 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-8">

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

          {/* ─── MAIN TABS ─── */}
          <div className="animate-in fade-in duration-500 delay-200">
            <TabNav tabs={tabs} activeTabId={activeTab} onTabChange={(tab) => setActiveTab(tab as 'appointments' | 'favorites' | 'stats' | 'settings' | 'referrals')} />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
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
      </div>

      {selectedAppointmentForReview && (
        <ReviewModal
          isOpen={!!selectedAppointmentForReview}
          onClose={() => setSelectedAppointmentForReview(null)}
          onSubmit={handleReviewSubmit}
          appointment={selectedAppointmentForReview}
          userId={user?.id || ''}
        />
      )}
    </div>
  );
};

/* ═══ REFERRAL SECTION ═══ */

const ReferralSection = ({ userId }: { userId: string }) => {
  const [referralCount, setReferralCount] = useState(0);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = getReferralLink(userId);

  useEffect(() => {
    getReferralCount(userId).then(res => {
      if (res.success && res.count !== undefined) setReferralCount(res.count);
    });
    getReferredUsers(userId).then(res => {
      if (res.success && res.data) setReferredUsers(res.data);
      setLoadingUsers(false);
    });
  }, [userId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('¡Enlace de referido copiado!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AgendaYa',
          text: '🎯 Te invito a AgendaYa — encuentra y reserva servicios profesionales cerca de ti.',
          url: referralLink,
        });
        return;
      } catch {}
    }
    handleCopy();
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary-600" /> Invita y gana
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          Comparte tu enlace con amigos y haz crecer la comunidad AgendaYa.
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-2xl p-6 shadow-xl shadow-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm font-bold uppercase tracking-widest">Tus referidos</p>
            <p className="text-4xl font-black text-white mt-1">{referralCount}</p>
            <p className="text-primary-200/60 text-xs font-medium mt-1">
              {referredUsers.length > 0
                ? `Último: ${new Date(referredUsers[0].created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Aún no has referido a nadie'}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Tu enlace de invitación
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-600 dark:text-slate-300 truncate">
            <LinkIcon className="w-4 h-4 flex-shrink-0 text-primary-500" />
            <span className="truncate">{referralLink}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? <Copy className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              onClick={handleShare}
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Share via Social */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
          Compartir en redes
        </h3>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent('🎯 Te invito a AgendaYa — reserva servicios profesionales cerca de ti. ' + referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800/50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('🎯 Te invito a AgendaYa — reserva servicios profesionales cerca de ti.')}&url=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-200 dark:border-blue-800/50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
          Personas que se unieron con tu enlace
          {referredUsers.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-[10px]">
              {referredUsers.length}
            </span>
          )}
        </h3>
        {loadingUsers ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-400">Aún no tienes referidos</p>
            <p className="text-xs text-slate-400 mt-1">Comparte tu enlace para empezar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user.full_name || 'Usuario'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email
                        ? user.email.replace(/^(.{1,2})(.*)(@.*)$/, '$1***$3')
                        : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    user.role === 'business_owner'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : user.role === 'client'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {user.role === 'business_owner' ? 'Negocio' : user.role === 'client' ? 'Cliente' : 'Visitor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;
