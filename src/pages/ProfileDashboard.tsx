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

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pastCurrentPage, setPastCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  // Swipe handlers para cambiar tabs con gesto horizontal
  const tabOrder = ['upcoming','past','profile'] as const;
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
            <nav className="-mb-px flex space-x-2">
              <button onClick={() => dispatch(setActiveTab('upcoming'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'upcoming' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>Próximas citas</button>
              <button onClick={() => dispatch(setActiveTab('past'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'past' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>Historial</button>
              <button onClick={() => dispatch(setActiveTab('profile'))} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'}`}>Mis Datos</button>
            </nav>
          </div>

          <div {...swipeHandlers}>
            {/* Pestaña de citas próximas */}
            {activeTab === 'upcoming' && (
              <UpcomingAppointments
                appointments={appointments}
                loading={loading}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
              />
            )}

            {/* Pestaña de historial */}
            {activeTab === 'past' && (
              <PastAppointments
                appointments={pastAppointments}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard; 
