import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { dispatchUserProfileUpdated } from '../lib/events';
import UserProfileSection from '../components/profile/UserProfileSection';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppointments } from '../hooks/useAppointments';
import { UserProfile } from '../lib/supabase';
import { ApiClient } from '../lib/apiClient';
import { useToast } from '../hooks/useToast';
import { useUIConfig } from '../hooks/useUIConfig';
import UserAppointmentList from '../components/appointments/UserAppointmentList';
import { Appointment } from '../types/appointment';
import ReviewModal from '../components/appointments/ReviewModal';

// UI Components
import TabNav, { Tab } from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import Pagination from '../components/ui/Pagination';

type ProfileDashboardProps = {
  user: UserProfile | null;
};

const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');

const ProfileDashboard = ({ user }: ProfileDashboardProps) => {
  const dispatch = useAppDispatch();
  const { itemsPerPage, saveItemsPerPage } = useUIConfig();
  const toast = useToast();
  const navigate = useNavigate();

  // Realtime appointments via custom hook
  const { appointments, refreshAppointments } = useAppointments(user?.id);

  // Avatar for header
  const FALLBACK_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
  const avatarKey = user?.avatar_url;
  const avatarUrl = avatarKey
    ? (avatarKey.startsWith('http')
      ? avatarKey
      : supabase.storage.from('avatars').getPublicUrl(avatarKey).data.publicUrl)
    : FALLBACK_AVATAR;

  // Estado para indicar si el usuario tiene un negocio
  const [hasBusiness, setHasBusiness] = useState(false);

  // Estado para el perfil de usuario
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [itemsPerPageMessage, setItemsPerPageMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estados para la paginación
  const [pagination, setPagination] = useState({
    upcoming: { page: 1, perPage: itemsPerPage },
    pending: { page: 1, perPage: itemsPerPage },
    history: { page: 1, perPage: itemsPerPage }
  });

  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState<'appointments' | 'settings'>('appointments');

  // Sub-tabs for Appointments
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('upcoming');
  
  // Sub-tabs for Settings
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');

  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<Appointment | null>(null);

  const handlePageChange = (section: keyof typeof pagination, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage }
    }));
  };

  // Cálculo de conteos y filtros
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const pastAppointments = appointments.filter(
    (appointment) =>
      appointment.status === 'completed' ||
      appointment.status === 'cancelled' ||
      (new Date(appointment.start_time) < new Date() &&
        !['pending', 'confirmed'].includes(appointment.status))
  );

  // Debugging para verificar el conteo
  console.log('Total appointments:', appointments.length);
  console.log('Past appointments:', pastAppointments.length);
  console.log('Past appointments data:', pastAppointments);

  // Conteos para las pestañas
  const upcomingCount = confirmedAppointments.length;
  const pendingCount = pendingAppointments.length;
  const pastCount = pastAppointments.length;
  const activeAppointmentsCount = upcomingCount + pendingCount;

  // Calculate paginated appointments for each section
  const getPaginatedItems = (items: any[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return items.slice(startIndex, endIndex);
  };

  const pagedUpcoming = getPaginatedItems(confirmedAppointments, pagination.upcoming.page, pagination.upcoming.perPage);
  const pagedPending = getPaginatedItems(pendingAppointments, pagination.pending.page, pagination.pending.perPage);
  const paginatedPastAppointments = getPaginatedItems(pastAppointments, pagination.history.page, pagination.history.perPage);

  // Prepare tabs for TabNav component
  const tabs: Tab[] = [
    { id: 'appointments', label: 'Citas', count: activeAppointmentsCount },
    { id: 'settings', label: 'Configuración' }
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'appointments' | 'settings');
  };

  const appointmentTabs: Tab[] = [
    { id: 'upcoming', label: 'Próximas', count: upcomingCount },
    { id: 'pending', label: 'Pendientes', count: pendingCount },
    { id: 'history', label: 'Historial', count: pastCount }
  ];

  const settingsTabs: Tab[] = [
    { id: 'profile', label: 'Perfil' },
    { id: 'general', label: 'Ajustes' }
  ];

  // Verificar si el usuario tiene un negocio
  useEffect(() => {
    const checkBusiness = async () => {
      if (!user) return;
      try {
        const response = await ApiClient.getUserBusiness(user.id);
        if (response.success && response.data) {
          setHasBusiness(true);
        } else {
          setHasBusiness(false);
        }
      } catch (error) {
        console.error('Error al verificar negocio:', error);
        setHasBusiness(false);
      }
    };
    checkBusiness();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setProfileMessage({ text: 'No hay información de usuario disponible', type: 'error' });
      return;
    }

    setSaving(true);
    setProfileMessage(null);

    try {
      // Obtener la sesión actual para tener el objeto User
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No se pudo obtener la sesión del usuario');
      }

      // Actualizar perfil del usuario
      const response = await ApiClient.updateUserProfile(user.id, {
        full_name: profileData.full_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url || undefined,
        updated_at: new Date().toISOString()
      });

      if (response.success && response.data) {
        // Actualizar el estado local con los datos actualizados
        setProfileData({
          ...profileData,
          ...response.data
        });

        // Disparar evento personalizado para actualizar el estado global
        dispatchUserProfileUpdated(session.user, response.data);

        const successMsg = 'Perfil actualizado correctamente';
        setProfileMessage({ text: successMsg, type: 'success' });
        toast.success(successMsg);
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
  };

  // Handlers for appointment actions
  const handleReschedule = (appointment: Appointment) => {
    // Navigate to public business page and open booking form for rescheduling
    const businessName = appointment.businesses?.name;
    if (!businessName) return;
    const slug = slugify(businessName);
    navigate(`/${slug}?reschedule=true&serviceId=${appointment.service_id}&date=${encodeURIComponent(appointment.start_time)}`);
  };

  const handleCancel = async (appointment: Appointment) => {
    if (!user) return;
    try {
      const response = await ApiClient.updateAppointmentStatus(appointment.id, 'cancelled');
      if (!response.success) {
        console.error(response.error || 'Error al cancelar la cita');
        toast.error('Error al cancelar la cita');
      } else {
        toast.success('Cita cancelada correctamente');
      }
    } catch (err: any) {
      console.error(err.message || 'Error al cancelar la cita');
      toast.error('Error al cancelar la cita');
    }
  };

  const handleReview = (appointment: Appointment) => {
    setSelectedAppointmentForReview(appointment);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user || !selectedAppointmentForReview) return;

    try {
      const response = await ApiClient.createBusinessReview(
        selectedAppointmentForReview.id,
        selectedAppointmentForReview.business_id,
        user.id,
        rating,
        comment
      );

      if (response.success) {
        toast.success('Reseña enviada correctamente');
        await refreshAppointments();

        // Dispatch event to notify business
        window.dispatchEvent(new CustomEvent('businessReviewAdded', {
          detail: { businessId: selectedAppointmentForReview.business_id }
        }));

        setSelectedAppointmentForReview(null);
      } else {
        toast.error(response.error || 'Error al enviar la reseña');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la reseña');
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    if (value >= 1 && value <= 50) {
      dispatch({ type: 'ui/setItemsPerPage', payload: value });
    }
  };

  const handleSaveItemsPerPage = async () => {
    if (!user) return;

    try {
      setItemsPerPageMessage(null);
      const success = await saveItemsPerPage(user.id);

      if (success) {
        setItemsPerPageMessage({ text: 'Configuración guardada correctamente', type: 'success' });
      } else {
        setItemsPerPageMessage({ text: 'Error al guardar la configuración', type: 'error' });
      }
    } catch (error: any) {
      setItemsPerPageMessage({ text: error.message || 'Error al guardar la configuración', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto pt-6 pb-20 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={`${user?.full_name || 'Usuario'} avatar`}
                  className="h-16 w-16 rounded-2xl object-cover shadow-lg border-2 border-white dark:border-slate-800 transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Hola, {user?.full_name?.split(' ')[0] || 'Usuario'}
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bienvenido a tu panel de control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasBusiness ? (
                <Link 
                  to="/business/dashboard" 
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25"
                >
                  Mi Negocio
                </Link>
              ) : (
                <Link 
                  to="/business/register" 
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 text-sm font-bold rounded-xl border border-primary-100 dark:border-primary-900/30 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all shadow-sm"
                >
                  Registrar mi negocio
                </Link>
              )}
            </div>
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
                    title="Mis Reservas" 
                    description="Gestiona tus citas próximas y revisa tu historial"
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
                  {activeAppointmentTab === 'upcoming' && (
                    <div className="space-y-6">
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
                  )}

                  {activeAppointmentTab === 'pending' && (
                    <div className="space-y-6">
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
                  )}

                  {activeAppointmentTab === 'history' && (
                    <div className="space-y-6">
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
                  )}
                </div>
              </div>
            )}

            {/* Tab de Configuración */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader 
                    title="Configuración" 
                    description="Actualiza tu perfil y preferencias de la cuenta"
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
                    <div className="card p-6 space-y-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
                          <Settings className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Preferencias de la Interfaz</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="items_per_page" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                            Registros por página
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              id="items_per_page"
                              min="1"
                              max="50"
                              value={itemsPerPage}
                              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value) || 1)}
                              className="w-24 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                            />
                            <button
                              onClick={handleSaveItemsPerPage}
                              className="inline-flex items-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 gap-2"
                            >
                              Guardar
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Ajusta cuántos elementos quieres ver por página en tus listados.
                          </p>
                        </div>

                        {itemsPerPageMessage && (
                          <div className={`alert ${itemsPerPageMessage.type === 'success' ? 'alert-success' : 'alert-error'} flex items-center gap-2`}>
                            <p className="text-sm font-bold">{itemsPerPageMessage.text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Reseña */}
      {selectedAppointmentForReview && (
        <ReviewModal
          isOpen={!!selectedAppointmentForReview}
          onClose={() => setSelectedAppointmentForReview(null)}
          onSubmit={handleReviewSubmit}
          appointment={selectedAppointmentForReview}
        />
      )}
    </div>
  );
};

export default ProfileDashboard;