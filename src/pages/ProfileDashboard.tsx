import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  updateUserProfile,
  getUserBusiness,
  updateAppointmentStatus,
} from '../lib/api';
import { UserProfile } from '../lib/supabase';
import { dispatchUserProfileUpdated } from '../lib/events';
import UpcomingAppointments from '../components/profile/UpcomingAppointments';
import PastAppointments from '../components/profile/PastAppointments';
import UserProfileSection from '../components/profile/UserProfileSection';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/useAppDispatch';
import type { RootState } from '../store';
import { setActiveTab } from '../store/uiSlice';
import { notifySuccess, notifyError } from '../lib/toast';
import { useAppointments } from '../hooks/useAppointments';
import { useSwipeable } from 'react-swipeable';

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
  // Realtime appointments via custom hook
  const { appointments, pastAppointments, loading, error } = useAppointments(user?.id || null);
  console.log('useAppointments:', { appointments, pastAppointments, loading, error });
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

  // Estados para la paginación y configuración de registros por página
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [pastCurrentPage, setPastCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(user?.items_per_page || 5);
  const [itemsPerPageMessage, setItemsPerPageMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Remove localStorage loading since we're using profile value
  useEffect(() => {
    if (user?.items_per_page) {
      setItemsPerPage(user.items_per_page);
    }
  }, [user]);

  // Cálculo de conteos y filtros
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const completedAppointments = appointments.filter(a => a.status === 'completed');

  const upcomingCount = confirmedAppointments.length;
  const pendingCount = pendingAppointments.length;
  const pastCount = completedAppointments.length;

  const navigate = useNavigate();

  // Swipe handlers para cambiar tabs con gesto horizontal
  const tabOrder = ['upcoming', 'pending', 'past', 'profile', 'general'] as const;
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabOrder.indexOf(activeTab);
      if (idx < tabOrder.length - 1) dispatch(setActiveTab(tabOrder[idx + 1]));
    },
    onSwipedRight: () => {
      const idx = tabOrder.indexOf(activeTab);
      if (idx > 0) dispatch(setActiveTab(tabOrder[idx - 1]));
    },
    trackMouse: true,
  });

  // Efecto para desplazar el tab activo al centro de la vista
  useEffect(() => {
    const btn = document.getElementById(`tab-${activeTab}`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab]);

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
        // Agregar un temporizador para evitar que se quede cargando indefinidamente
        const timeoutId = setTimeout(() => {
          setHasBusiness(false);
        }, 10000); // 10 segundos para esta operación

        try {
          const { success, business } = await getUserBusiness(user.id);
          setHasBusiness(success && business !== null);
        } catch (err) {
          setHasBusiness(false);
        } finally {
          clearTimeout(timeoutId);
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
      const updatedProfile = await updateUserProfile(user.id, {
        full_name: profileData.full_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url || undefined,
        updated_at: new Date().toISOString()
      });

      if (updatedProfile) {
        // Actualizar el estado local con los datos actualizados
        setProfileData({
          ...profileData,
          ...updatedProfile
        });

        // Disparar evento personalizado para actualizar el estado global
        dispatchUserProfileUpdated(session.user, updatedProfile);

        const successMsg = 'Perfil actualizado correctamente';
        setProfileMessage({ text: successMsg, type: 'success' });
        notifySuccess(successMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Error al actualizar perfil';
      setProfileMessage({ text: errorMsg, type: 'error' });
      notifyError(errorMsg);
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
      await updateAppointmentStatus(appointment.id, 'cancelled');
      notifySuccess(`Cita cancelada por ${user.full_name}`);
    } catch (err: any) {
      notifyError(err.message || 'Error al cancelar la cita');
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      setItemsPerPage(val);
      setItemsPerPageMessage(null);
    }
  };

  const handleSaveItemsPerPage = async () => {
    if (!user) return;
    
    try {
      setItemsPerPageMessage(null);
      const { error } = await supabase
        .from('profiles')
        .update({ items_per_page: itemsPerPage })
        .eq('id', user.id);

      if (error) throw error;

      // Get current session to update global state
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No se pudo obtener la sesión del usuario');
      }

      // Update global state with new items_per_page
      dispatchUserProfileUpdated(session.user, { ...user, items_per_page: itemsPerPage });
      
      // Show success message in UI and toast
      setItemsPerPageMessage({ text: 'Configuración guardada correctamente', type: 'success' });
      notifySuccess('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving items per page:', error);
      // Show error message in UI and toast
      setItemsPerPageMessage({ text: 'Error al guardar la configuración', type: 'error' });
      notifyError('Error al guardar la configuración');
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          {/* Show error message if any */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 dark:bg-red-900 dark:text-white rounded-none">
              {error}
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-8 sm:flex sm:items-baseline">
              <h3 className="text-lg dark:text-white leading-6 font-medium text-gray-900">Mi Perfil</h3>
              {hasBusiness ? (
                <Link to="/business/dashboard" className="inline-flex dark:text-white dark:hover:text-black items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                  Mi Negocio
                </Link>
              ) : (
                <Link to="/business/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                  Registrar mi Negocio
                </Link>
              )}
            </div>
          </div>

          {/* Sub-navegación del perfil */}
          <div className="border-b border-gray-200 mt-4">
            <nav className="-mb-px flex space-x-2 overflow-x-auto whitespace-nowrap">
              <button id="tab-upcoming" onClick={() => dispatch(setActiveTab('upcoming'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'upcoming' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>
                Próximas citas:<span className="ml-1 text-gray-500 dark:text-gray-400">{upcomingCount}</span>
              </button>
              <button id="tab-pending" onClick={() => dispatch(setActiveTab('pending'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>
                Pendientes:<span className="ml-1 text-gray-500 dark:text-gray-400">{pendingCount}</span>
              </button>
              <button id="tab-past" onClick={() => dispatch(setActiveTab('past'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'past' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>
                Historial:<span className="ml-1 text-gray-500 dark:text-gray-400">{pastCount}</span>
              </button>
              <button id="tab-profile" onClick={() => dispatch(setActiveTab('profile'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>
                Mis Datos
              </button>
              <button id="tab-general" onClick={() => dispatch(setActiveTab('general'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>
                General
              </button>
            </nav>
          </div>

          <div {...swipeHandlers}>
            {/* Pestaña de citas próximas (confirmadas) */}
            {activeTab === 'upcoming' && (
              <UpcomingAppointments
                appointments={confirmedAppointments}
                loading={loading}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
              />
            )}

            {/* Pestaña de citas pendientes */}
            {activeTab === 'pending' && (
              <UpcomingAppointments
                appointments={pendingAppointments}
                loading={loading}
                currentPage={pendingPage}
                onPageChange={setPendingPage}
                itemsPerPage={itemsPerPage}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
              />
            )}

            {/* Pestaña de historial (completadas) */}
            {activeTab === 'past' && (
              <PastAppointments
                appointments={completedAppointments}
                loading={loading}
                currentPage={pastCurrentPage}
                onPageChange={setPastCurrentPage}
                itemsPerPage={itemsPerPage}
                onReschedule={handleReschedule}
              />
            )}

            {/* Pestaña de Perfil */}
            {activeTab === 'profile' && (
              <UserProfileSection
                profileData={profileData}
                saving={saving}
                message={profileMessage}
                onSave={handleProfileSubmit}
                onChange={handleProfileChange}
              />
            )}

            {activeTab === 'general' && (
              <div className="p-6 mt-2 dark:bg-opacity-10 bg-gray-50 
              rounded-md">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuración General</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Registros por página
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="number"
                          id="itemsPerPage"
                          value={itemsPerPage}
                          onChange={handleItemsPerPageChange}
                          min="1"
                          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleSaveItemsPerPage}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
