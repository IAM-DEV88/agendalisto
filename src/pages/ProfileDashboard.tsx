import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { dispatchUserProfileUpdated } from '../lib/events';
import UserProfileSection from '../components/profile/UserProfileSection';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setActiveTab } from '../store/uiSlice';
import { useAppointments } from '../hooks/useAppointments';
import { UserProfile } from '../lib/supabase';
import { ApiClient } from '../lib/apiClient';
import { useToast } from '../hooks/useToast';
import { useUIConfig } from '../hooks/useUIConfig';
import UserAppointmentList from '../components/appointments/UserAppointmentList';
import '../styles/appointments.css';
import { Appointment } from '../types/appointment';

// UI Components
import TabNav, { Tab } from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';

type ProfileDashboardProps = {
  user: UserProfile | null;
};

const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');

// Tipos para las pestañas
type TabId = 'appointments' | 'profile' | 'general';

const ProfileDashboard = ({ user }: ProfileDashboardProps) => {
  const dispatch = useAppDispatch();
  const [activeTab, setLocalActiveTab] = useState<TabId>('appointments');
  const { itemsPerPage, saveItemsPerPage } = useUIConfig();
  const toast = useToast();
  const navigate = useNavigate();

  // Realtime appointments via custom hook
  const { appointments } = useAppointments(user?.id || null);

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

  // Agregar estado para controlar las secciones colapsables
  const [collapsedSections, setCollapsedSections] = useState({
    upcoming: true,
    pending: true,
    past: true
  });

  const toggleSection = (section: 'upcoming' | 'pending' | 'past') => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Pagination for different sections
  const [pagination, setPagination] = useState({
    upcoming: { page: 1, perPage: itemsPerPage },
    pending: { page: 1, perPage: itemsPerPage },
    past: { page: 1, perPage: itemsPerPage }
  });

  const handlePageChange = (section: keyof typeof pagination, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage }
    }));
  };

  // Calculate paginated appointments for each section
  const getPaginatedItems = <T extends any>(items: T[], section: keyof typeof pagination) => {
    const { page, perPage } = pagination[section];
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return items.slice(start, end);
  };

  // Cálculo de conteos y filtros
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const pastAppointments = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  const pagedUpcoming = getPaginatedItems(confirmedAppointments, 'upcoming');
  const pagedPending = getPaginatedItems(pendingAppointments, 'pending');
  const pagedPast = getPaginatedItems(pastAppointments, 'past');

  // Calculate active appointments count (upcoming + pending)
  const activeAppointmentsCount = confirmedAppointments.length + pendingAppointments.length;

  const handleTabChange = (tabId: TabId) => {
    setLocalActiveTab(tabId);
    dispatch(setActiveTab(tabId));
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

  // Estado para el formulario de reseña
  const [reviewForm, setReviewForm] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
    rating: number;
    comment: string;
  }>({
    isOpen: false,
    appointment: null,
    rating: 5,
    comment: ''
  });

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
    setReviewForm({
      isOpen: true,
      appointment,
      rating: 5,
      comment: ''
    });
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewForm.appointment) return;
    
    try {
      const response = await ApiClient.createBusinessReview(
        reviewForm.appointment.id,
        reviewForm.appointment.business_id,
        user.id,
        reviewForm.rating,
        reviewForm.comment
      );

      if (response.success && response.data) {
        // Disparar evento para notificar al dashboard del negocio
        window.dispatchEvent(new CustomEvent('businessReviewAdded', { 
          detail: { businessId: reviewForm.appointment.business_id } 
        }));

        toast.success('Reseña enviada correctamente');
        setReviewForm(prev => ({ ...prev, isOpen: false }));
      } else {
        throw new Error(response.error || 'Error al enviar la reseña');
      }
    } catch (err: any) {
      console.error(err.message || 'Error al enviar la reseña');
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

  // Prepare tabs for TabNav component
  const tabs: Tab[] = [
    { id: 'appointments', label: 'Citas', count: activeAppointmentsCount },
    { id: 'profile', label: 'Mis Datos' },
    { id: 'general', label: 'General' }
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto mt-8 px-4 lg:px-8">
        <div className="px-4sm:px-0">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
                />
                <h3 className="text-lg  leading-6 font-medium text-gray-900">Mi Perfil</h3>
              </div>
              {hasBusiness ? (
                <Link to="/business/dashboard" className="inline-flex  dark:hover:text-black self-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                  Mi Negocio
                </Link>
              ) : (
                <Link to="/business/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                  Registrar mi Negocio
                </Link>
              )}
            </div>
          </div>

          {/* Use TabNav component */}
          <TabNav
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={(tabId) => handleTabChange(tabId as TabId)}
          />

          <div className="mt-6">
            {/* Tab de Citas */}
            {activeTab === 'appointments' && (
              <>
                {/* Próximas Citas */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleSection('upcoming')}
                  >
                    <SectionHeader 
                      title={`Próximas Citas (${confirmedAppointments.length})`}
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
                    <>
                      <UserAppointmentList
                        appointments={pagedUpcoming}
                        onReschedule={handleReschedule}
                        onCancel={handleCancel}
                        currentPage={pagination.upcoming.page}
                        itemsPerPage={pagination.upcoming.perPage}
                        onPageChange={(page) => handlePageChange('upcoming', page)}
                      />
                    </>
                  )}
                </div>

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
                      <UserAppointmentList
                        appointments={pagedPending}
                        onReschedule={handleReschedule}
                        onCancel={handleCancel}
                        currentPage={pagination.pending.page}
                        itemsPerPage={pagination.pending.perPage}
                        onPageChange={(page) => handlePageChange('pending', page)}
                      />
                    </>
                  )}
                </div>

                {/* Historial de Citas */}
                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleSection('past')}
                  >
                    <SectionHeader 
                      title={`Historial de Citas (${pastAppointments.length})`}
                      description="Citas completadas y pasadas."
                    />
                    <button className="p-2">
                      <svg 
                        className={`w-6 h-6 transform transition-transform ${collapsedSections.past ? '-rotate-90' : 'rotate-0'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {!collapsedSections.past && (
                    <>
                      <UserAppointmentList
                        appointments={pagedPast}
                        onReschedule={handleReschedule}
                        onReview={handleReview}
                        currentPage={pagination.past.page}
                        itemsPerPage={pagination.past.perPage}
                        onPageChange={(page) => handlePageChange('past', page)}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {/* Pestaña de perfil */}
            {activeTab === 'profile' && (
              <>
                <SectionHeader title="Datos personales" />
                <UserProfileSection
                  profileData={profileData}
                  onChange={handleProfileChange}
                  onSave={handleProfileSubmit}
                  saving={saving}
                  message={profileMessage}
                />
              </>
            )}

            {/* Pestaña de configuración general */}
            {activeTab === 'general' && (
              <>
                <SectionHeader title="Configuración general" />
                <div className="dark:bg-opacity-10 bg-gray-50 shadow overflow-hidden sm:rounded-lg p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Preferencias de visualización
                      </h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>Configura cuántos elementos quieres ver por página.</p>
                      </div>
                      <div className="mt-5">
                        <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700">
                          Elementos por página
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm w-32">
                          <input
                            type="number"
                            name="itemsPerPage"
                            id="itemsPerPage"
                            className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                            min="1"
                            max="50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveItemsPerPage}
                          className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Guardar preferencia
                        </button>
                        {itemsPerPageMessage && (
                          <p className={`mt-2 text-sm ${itemsPerPageMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {itemsPerPageMessage.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Reseña */}
      {reviewForm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Dejar una reseña</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Calificación</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    className={`text-2xl ${
                      star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comentario (opcional)</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Escribe tu comentario aquí..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setReviewForm(prev => ({ ...prev, isOpen: false }))}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReview}
                className="btn-review"
              >
                Enviar reseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDashboard; 
