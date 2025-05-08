import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { dispatchUserProfileUpdated } from '../lib/events';
import UpcomingAppointments from '../components/profile/UpcomingAppointments';
import PastAppointments from '../components/profile/PastAppointments';
import UserProfileSection from '../components/profile/UserProfileSection';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/useAppDispatch';
import type { RootState } from '../store';
import { setActiveTab } from '../store/uiSlice';
import { useAppointments } from '../hooks/useAppointments';
import { useSwipeable } from 'react-swipeable';
import { UserProfile } from '../lib/supabase';
import { ApiClient } from '../lib/apiClient';
import { useToast } from '../hooks/useToast';
import { useUIConfig } from '../hooks/useUIConfig';

// UI Components
import TabNav, { Tab } from '../components/ui/TabNav';
import SectionHeader from '../components/ui/SectionHeader';
import MessageAlert from '../components/ui/MessageAlert';

type ProfileDashboardProps = {
  user: UserProfile | null;
};

interface Appointment {
  id: string;
  business_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  businesses?: {
    name: string;
    address: string;
  };
  services?: {
    name: string;
    duration: number;
    price: number;
  };
  profiles?: {
    full_name: string;
    phone: string;
  };
  user_id: string;
}

// Helper to create slug from business name
const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');

const ProfileDashboard = ({ user }: ProfileDashboardProps) => {
  const dispatch = useAppDispatch();
  const activeTab = useSelector((state: RootState) => state.ui.activeTab);
  const { itemsPerPage, saveItemsPerPage } = useUIConfig();
  const toast = useToast();

  // Realtime appointments via custom hook
  const { appointments, loading, error } = useAppointments(user?.id || null);

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

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [pastCurrentPage, setPastCurrentPage] = useState(1);
  const [itemsPerPageMessage, setItemsPerPageMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cálculo de conteos y filtros
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const completedAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const upcomingCount = confirmedAppointments.length;
  const pendingCount = pendingAppointments.length;
  const pastCount = completedAppointments.length;

  const navigate = useNavigate();

  // Swipe handlers para cambiar tabs con gesto horizontal
  const tabOrder = ['upcoming', 'pending', 'past', 'profile', 'general'] as const;
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabOrder.indexOf(activeTab as typeof tabOrder[number]);
      if (idx < tabOrder.length - 1) dispatch(setActiveTab(tabOrder[idx + 1]));
    },
    onSwipedRight: () => {
      const idx = tabOrder.indexOf(activeTab as typeof tabOrder[number]);
      if (idx > 0) dispatch(setActiveTab(tabOrder[idx - 1]));
    },
    trackMouse: true,
  });

  useEffect(() => {
    // Actualizar estado cuando cambia el usuario
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const checkBusiness = async () => {
      if (user?.id) {
        try {
          const response = await ApiClient.getUserBusiness(user.id);
          setHasBusiness(response.success && response.data !== null);
        } catch (err) {
          setHasBusiness(false);
        }
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
      }
    } catch (err: any) {
      console.error(err.message || 'Error al cancelar la cita');
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
    { id: 'upcoming', label: 'Próximas citas', count: upcomingCount },
    { id: 'pending', label: 'Pendientes', count: pendingCount },
    { id: 'past', label: 'Historial', count: pastCount },
    { id: 'profile', label: 'Mis Datos' },
    { id: 'general', label: 'General' }
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto mt-8 sm:px-6 lg:px-8">
        <div className="px-4sm:px-0">
          {/* Show error message if any */}
          {error && (
            <MessageAlert message={{ text: error, type: 'error' }} />
          )}
          <div>
            <div className="flex items-center justify-between mb-4 sm:flex sm:items-baseline">
              <div className="flex items-center space-x-4">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
                />
                <h3 className="text-lg dark:text-white leading-6 font-medium text-gray-900">Mi Perfil</h3>
              </div>
              {hasBusiness ? (
                <Link to="/business/dashboard" className="inline-flex dark:text-white dark:hover:text-black self-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
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
            onTabChange={(tabId) => dispatch(setActiveTab(tabId as typeof tabOrder[number]))}
          />

          <div {...swipeHandlers} className="mt-6">
            {/* Pestaña de citas próximas (confirmadas) */}
            {activeTab === 'upcoming' && (
              <>
                <SectionHeader
                  title="Próximas Citas"
                  description="Citas confirmadas y programadas."
                />
                <UpcomingAppointments
                  appointments={confirmedAppointments}
                  loading={loading}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
                />
              </>
            )}

            {/* Pestaña de citas pendientes */}
            {activeTab === 'pending' && (
              <>
                <SectionHeader
                  title="Citas Pendientes"
                  description="Solicitudes pendientes de confirmación."
                />
                <UpcomingAppointments
                  appointments={pendingAppointments}
                  loading={loading}
                  currentPage={pendingPage}
                  onPageChange={setPendingPage}
                  itemsPerPage={itemsPerPage}
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
                />
              </>
            )}

            {/* Pestaña de historial (completadas) */}
            {activeTab === 'past' && (
              <>
                <SectionHeader
                  title="Historial de Citas"
                  description="Citas completadas y pasadas."
                />
                <PastAppointments
                  appointments={completedAppointments}
                  loading={loading}
                  currentPage={pastCurrentPage}
                  onPageChange={setPastCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onReschedule={handleReschedule}
                />
              </>
            )}

            {/* Pestaña de Perfil */}
            {activeTab === 'profile' && (
              <>
                <SectionHeader
                  title="Información Personal"
                  description="Actualiza tus datos personales."
                />
                <UserProfileSection
                  profileData={profileData}
                  saving={saving}
                  message={profileMessage}
                  onSave={handleProfileSubmit}
                  onChange={handleProfileChange}
                />
              </>
            )}

            {activeTab === 'general' && (
              <div>
                <SectionHeader
                  title="Configuración General"
                  description="Personaliza tu experiencia en la plataforma."
                />
                <div className="p-6 mt-2 dark:bg-opacity-10 bg-gray-50 mt-4 space-y-4">
                  <div>
                    <div className="mt-1 flex items-center space-x-2">
                      <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Registros por página
                      </label>
                      <input
                        type="number"
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        min="1"
                        className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="mt-2 flex flex-col">
                      <p className="mt-2 text-sm text-gray-400">
                        Número de registros que se mostrarán por página en las listas.
                      </p>
                      <button
                        type="button"
                        onClick={handleSaveItemsPerPage}
                        className="ml-auto mt-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Guardar
                      </button>
                    </div>
                    {itemsPerPageMessage && (
                      <MessageAlert message={itemsPerPageMessage} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard; 
