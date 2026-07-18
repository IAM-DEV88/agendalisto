import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { obtenerPerfilUsuario } from './lib/api';
import ScrollToTop from './components/ScrollToTop';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ChatGuia from './components/ChatGuia';
import InstallApp from './components/ui/InstallApp';
import ProtectedRoute from './components/ProtectedRoute';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './hooks/useAppDispatch';
import type { RootState } from './store';
import { setUser, setUserProfile, setBusinesses, setLoading, setAuthInitialized } from './store/userSlice';
import { getUserBusinesses } from './lib/api';
import { Toaster } from 'react-hot-toast';
import { notifySuccess } from './lib/toast';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ExploreBusinesses = lazy(() => import('./pages/ExploreBusinesses'));
const Crowdfunding = lazy(() => import('./pages/Crowdfunding'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Plans = lazy(() => import('./pages/Plans'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const ServicePaymentSuccess = lazy(() => import('./pages/ServicePaymentSuccess'));
const GiftBooking = lazy(() => import('./pages/GiftBooking'));
const EmbedWidget = lazy(() => import('./pages/EmbedWidget'));
const Embajadores = lazy(() => import('./pages/Embajadores'));
const CajasCompensacion = lazy(() => import('./pages/CajasCompensacion'));
const B2BHoteles = lazy(() => import('./pages/B2BHoteles'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPostView = lazy(() => import('./pages/BlogPostView'));
const ProfileDashboard = lazy(() => import('./pages/ProfileDashboard'));
const BusinessRegister = lazy(() => import('./pages/BusinessRegister'));
const BusinessOnboarding = lazy(() => import('./pages/BusinessOnboarding'));
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard'));
const ServiceFormPage = lazy(() => import('./pages/ServiceFormPage'));
const ModeratorDashboard = lazy(() => import('./pages/ModeratorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CityLandingPage = lazy(() => import('./pages/CityLandingPage'));
const SEOLandingPage = lazy(() => import('./pages/SEOLandingPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BusinessPublicPage = lazy(() => import('./pages/BusinessPublicPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const userProfile = useSelector((state: RootState) => state.user.userProfile);
  const authInitialized = useSelector((state: RootState) => state.user.authInitialized);
  const authInProgressRef = useRef(false);

  const loadProfile = useCallback(async (userId: string) => {
    const { success, perfil } = await obtenerPerfilUsuario(userId);
    
    if (success && perfil) {
      dispatch(setUserProfile(perfil));
      if (perfil.role === 'business_owner' || perfil.role === 'admin' || perfil.role === 'moderator') {
        const bizRes = await getUserBusinesses(userId);
        if (bizRes.success && bizRes.businesses) {
          dispatch(setBusinesses(bizRes.businesses));
        }
      }
    } else {
      dispatch(setUserProfile(null));
    }
  }, [dispatch]);

  // Efecto para manejar autenticación, usando useCallback de loadProfile
  useEffect(() => {
    // Prevenir ejecuciones duplicadas
    if (authInProgressRef.current) return;
    authInProgressRef.current = true;
    
    dispatch(setLoading(true));

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          dispatch(setUser(session.user));
          await loadProfile(session.user.id);
        } else {
          dispatch(setUser(null));
          dispatch(setUserProfile(null));
          dispatch(setBusinesses([]));
        }
      } catch (err) {
      } finally {
        dispatch(setAuthInitialized(true));
        dispatch(setLoading(false));
      }
    };

    getInitialSession();

    // Suscribirse a cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // Evitar operaciones innecesarias para eventos no relacionados con login/logout
        const isSignificantEvent = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event);
        if (!isSignificantEvent) {
          return;
        }
        
        dispatch(setLoading(true));
        
        if (event === 'SIGNED_IN' && session?.user) {
          const currentUserId = user?.id || null;
          
          // Solo actualizar user/userProfile si el ID cambió o no hay perfil actual
          if (!currentUserId || currentUserId !== session.user.id || !userProfile) {
            dispatch(setUser(session.user));
            
            notifySuccess('Sesión iniciada');
            // Cargar perfil solo si es un usuario diferente o no hay perfil
            if (!userProfile || currentUserId !== session.user.id) {
              await loadProfile(session.user.id);
            }
          } else {
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch(setUser(null));
          dispatch(setUserProfile(null));
          dispatch(setBusinesses([]));
          notifySuccess('Sesión cerrada');
        }
        
        dispatch(setLoading(false));
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      subscription?.unsubscribe();
      authInProgressRef.current = false;
    };
  }, [dispatch, loadProfile]); // Solo depende de loadProfile (memoizado)

  // Escuchar el evento userProfileUpdated
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail.profile) {
        dispatch(setUserProfile(event.detail.profile));
      }
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, [dispatch]);

  // Real-time notifications para citas
  useEffect(() => {
    if (!authInitialized || !user || !userProfile) return;
    const channel = supabase
      .channel('public:agendaya_appointments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agendaya_appointments' }, ({ new: appt }: { new: Record<string, unknown> }) => {
        // Notificar al negocio de una nueva reserva
        if (userProfile.business_id === appt.business_id) {
          notifySuccess('Nueva reserva recibida');
        }
        if (user.id === appt.user_id) {
          notifySuccess('Tu reserva ha sido solicitada');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agendaya_appointments' }, ({ new: appt }: { new: Record<string, unknown> }) => {
        // Estatus de cita modificado
        if (user.id === appt.user_id) {
          let msg = '';
          if (appt.status === 'confirmed') msg = 'Tu cita ha sido confirmada';
          else if (appt.status === 'completed') msg = 'Tu cita ha sido completada';
          else if (appt.status === 'cancelled') msg = 'Tu cita ha sido cancelada';
          if (msg) notifySuccess(msg);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authInitialized, user, userProfile]);

  // Mostrar sólo loading inicial hasta que authInitialized sea true
  if (!authInitialized) {
    return <div className="flex h-screen w-full items-center justify-center">
      <p className="text-xl">Cargando aplicación...</p>
    </div>;
  }

  // Evitar loggear en cada render

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Nav user={userProfile} />
        <main className="flex-grow pt-16 bg-gray-50 dark:bg-gray-800 shadow-md">
          <Suspense fallback={<div className="flex h-full w-full items-center justify-center py-20"><p className="text-lg text-slate-400 font-medium">Cargando...</p></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/explore" element={<ExploreBusinesses />} />
            <Route path="/crowdfunding" element={<Crowdfunding />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/service/success" element={<ServicePaymentSuccess />} />
            <Route path="/:slug/gift/:serviceId" element={<GiftBooking />} />
            <Route path="/widget/:slug" element={<EmbedWidget />} />
            <Route path="/embajadores" element={<Embajadores />} />
            <Route path="/cajas-compensacion" element={<CajasCompensacion />} />
            <Route path="/hoteles" element={<B2BHoteles />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPostView />} />
            <Route path="/dashboard" element={
              <ProtectedRoute user={user} userProfile={userProfile}>
                <ProfileDashboard user={userProfile} />
              </ProtectedRoute>
            } />
            <Route path="/business/register" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="client">
                <BusinessRegister user={userProfile} />
              </ProtectedRoute>
            } />
            <Route path="/business/onboarding" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="business_owner">
                <BusinessOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/business/dashboard" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="business_owner">
                <BusinessDashboard />
              </ProtectedRoute>
            } />
            <Route path="/business/service/new" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="business_owner">
                <ServiceFormPage />
              </ProtectedRoute>
            } />
            <Route path="/business/service/:serviceId/edit" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="business_owner">
                <ServiceFormPage />
              </ProtectedRoute>
            } />
            <Route path="/moderator/dashboard" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="moderator">
                <ModeratorDashboard user={userProfile} />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="admin">
                <AdminDashboard user={userProfile} />
              </ProtectedRoute>
            } />
            <Route path="/ciudades/:city" element={<CityLandingPage />} />
            <Route path="/categorias/:category" element={<SEOLandingPage />} />
            <Route path="/review/:appointmentId" element={
              <ProtectedRoute user={user} userProfile={userProfile} requiredRole="client">
                <ReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/:slug/book/:serviceId" element={<BookingPage />} />
            <Route path="/:slug" element={<BusinessPublicPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </main>
        <Footer />
        <ChatGuia />
        <InstallApp />
        {/* Toaster para mostrar notificaciones */}
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App; 
