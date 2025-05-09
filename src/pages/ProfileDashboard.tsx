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
  const { appointments, loading, error, addReview } = useAppointments(user?.id);

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

  // Estado para las secciones colapsables
  const [collapsedSections, setCollapsedSections] = useState({
    upcoming: false,
    pending: false,
    history: false
  });

  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState<'appointments' | 'settings'>('appointments');

  // Estado para secciones colapsables de configuración
  const [collapsedConfigSections, setCollapsedConfigSections] = useState({
    profile: true,
    general: true
  });

  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<Appointment | null>(null);

  const toggleSection = (section: 'upcoming' | 'pending' | 'history') => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const toggleConfigSection = (section: keyof typeof collapsedConfigSections) => {
    setCollapsedConfigSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      const result = await ApiClient.createBusinessReview(
        selectedAppointmentForReview.id,
        selectedAppointmentForReview.business_id,
        user.id,
        rating,
        comment
      );

      if (result.success && result.data) {
        // Actualizar el estado local
        const updatedAppointment = {
          ...selectedAppointmentForReview,
          review: result.data
        };
        addReview(selectedAppointmentForReview.id, result.data);
        
        // Notificar al negocio
        const event = new CustomEvent('new-review', { 
          detail: { businessId: selectedAppointmentForReview.business_id }
        });
        window.dispatchEvent(event);

        // Mostrar notificación de éxito
        toast.success('¡Reseña enviada con éxito!');
        setSelectedAppointmentForReview(null);
      } else {
        // Mostrar mensaje específico para reseña duplicada
        const errorMessage = result.error === 'Esta cita ya tiene una reseña'
          ? 'Ya has dejado una reseña para esta cita'
          : result.error || 'Error al enviar la reseña';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Error al enviar la reseña');
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
    <div className="max-w-7xl mx-auto mt-6 sm:px-6 lg:px-8">
      <div className="px-4 py-2 sm:px-0">
        <div className="flex items-center justify-between mb-4 sm:flex sm:items-baseline">
          <div className="flex items-center space-x-4">
            <img
              src={avatarUrl}
              alt={`${user?.full_name || 'Usuario'} avatar`}
              className="h-12 w-12 rounded-full object-cover"
            />
            <h3 className="text-lg leading-6 font-medium text-gray-900 grow">
              {user?.full_name || 'Usuario'}
            </h3>
          </div>
          <div className="flex flex-col gap-4 self-center">
            {hasBusiness ? (
              <Link to="/business/dashboard" className="dark:hover:text-black inline-flex px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                Mi Negocio
              </Link>
            ) : (
              <Link to="/business/register" className="dark:hover:text-black inline-flex px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                Registrar negocio
              </Link>
            )}
          </div>
        </div>

        {/* Use TabNav component */}
        <TabNav 
          tabs={tabs} 
          activeTabId={activeTab} 
          onTabChange={handleTabChange} 
        />

        <div className="mt-6">
          {/* Tab de Citas */}
          {activeTab === 'appointments' && (
            <>
              {/* Próximas Citas */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-8">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('upcoming')}
                >
                  <SectionHeader 
                    title={`Próximas Citas (${upcomingCount})`}
                    description="Citas confirmadas y programadas."
                  />
                  <button className="p-2">
                    <svg 
                      className={`w-6 h-6 transform transition-transform ${collapsedSections.upcoming ? '-rotate-90' : 'rotate-0'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {!collapsedSections.upcoming && (
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
                )}
              </div>

              {/* Citas Pendientes */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-8">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('pending')}
                >
                  <SectionHeader 
                    title={`Citas Pendientes (${pendingCount})`}
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
                )}
              </div>

              {/* Historial de Citas */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('history')}
                >
                  <SectionHeader 
                    title={`Historial de Citas (${pastCount})`}
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
                )}
              </div>
            </>
          )}

          {/* Tab de Configuración */}
          {activeTab === 'settings' && (
            <>
              {/* Sección de Datos Personales */}
              <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-8">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleConfigSection('profile')}
                >
                  <SectionHeader 
                    title="Datos personales" 
                    description="Actualiza tu información personal."
                  />
                  <button className="p-2">
                    <svg 
                      className={`w-6 h-6 transform transition-transform ${collapsedConfigSections.profile ? '-rotate-90' : 'rotate-0'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {!collapsedConfigSections.profile && (
                  <UserProfileSection
                    profileData={profileData}
                    onChange={handleProfileChange}
                    onSave={handleProfileSubmit}
                    saving={saving}
                    message={profileMessage}
                  />
                )}
              </div>

              {/* Sección de Configuración General */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleConfigSection('general')}
                >
                  <SectionHeader 
                    title="Configuración general" 
                    description="Personaliza las opciones de tu cuenta."
                  />
                  <button className="p-2">
                    <svg 
                      className={`w-6 h-6 transform transition-transform ${collapsedConfigSections.general ? '-rotate-90' : 'rotate-0'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {!collapsedConfigSections.general && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-4">
                      <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                        Elementos por página:
                      </label>
                      <input
                        type="number"
                        id="itemsPerPage"
                        min="1"
                        max="50"
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-20 sm:text-sm border-gray-300 rounded-md"
                      />
                      <button
                        onClick={handleSaveItemsPerPage}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Guardar
                      </button>
                    </div>
                    {itemsPerPageMessage && (
                      <p className={`mt-2 text-sm ${itemsPerPageMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {itemsPerPageMessage.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={!!selectedAppointmentForReview}
        onClose={() => setSelectedAppointmentForReview(null)}
        appointment={selectedAppointmentForReview}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default ProfileDashboard; 
