import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';
import { obtenerPerfilUsuario } from './lib/api';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileDashboard from './pages/ProfileDashboard';
import BusinessRegister from './pages/BusinessRegister';
import BusinessDashboard from './pages/BusinessDashboard';
import BusinessPublicPage from './pages/BusinessPublicPage';
import ForgotPassword from './pages/ForgotPassword';
import ExploreBusinesses from './pages/ExploreBusinesses';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProfile } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const authInProgressRef = useRef(false);
  const retryTimeoutRef = useRef<number>();
  const profileLoadAttemptsRef = useRef(0);
  const MAX_PROFILE_LOAD_ATTEMPTS = 3;

  // Limpiar cualquier timeout pendiente al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Memoizar la función de carga de perfil para evitar recreaciones en cada render
  const loadProfile = useCallback(async (userId: string, isRetry = false) => {
    // No reintentar más allá del límite máximo
    if (isRetry && profileLoadAttemptsRef.current >= MAX_PROFILE_LOAD_ATTEMPTS) {
      console.log(`[App] loadProfile: Máximo de ${MAX_PROFILE_LOAD_ATTEMPTS} intentos alcanzado para ${userId}`);
      return false;
    }
    
    if (isRetry) {
      profileLoadAttemptsRef.current++;
      console.log(`[App] loadProfile: Intento ${profileLoadAttemptsRef.current} de ${MAX_PROFILE_LOAD_ATTEMPTS} para ${userId}`);
    } else {
      // Reiniciar contador para nuevas cargas (no reintentos)
      profileLoadAttemptsRef.current = 0;
    }

    try {
      console.log(`[App] loadProfile: Cargando perfil para ${userId}${isRetry ? ' (reintento)' : ''}`);
      const { success, perfil, error } = await obtenerPerfilUsuario(userId);
      
      if (success && perfil) {
        console.log(`[App] loadProfile: Perfil cargado exitosamente para ${userId}`);
        setUserProfile(perfil);
        return true;
      } else {
        console.error(`[App] loadProfile: Error al cargar perfil para ${userId}: ${error}`);
        
        // Si es timeout, programar reintento después de 2 segundos
        if (error === 'Timeout al obtener perfil de usuario' && profileLoadAttemptsRef.current < MAX_PROFILE_LOAD_ATTEMPTS) {
          if (retryTimeoutRef.current) {
            window.clearTimeout(retryTimeoutRef.current);
          }
          
          console.log(`[App] loadProfile: Programando reintento en 2 segundos...`);
          retryTimeoutRef.current = window.setTimeout(() => {
            console.log(`[App] loadProfile: Ejecutando reintento programado...`);
            loadProfile(userId, true);
          }, 2000);
        } else {
          // Error diferente de timeout o máximo de reintentos alcanzado
          setUserProfile(null);
        }
        return false;
      }
    } catch (err) {
      console.error(`[App] loadProfile: Excepción inesperada:`, err);
      setUserProfile(null);
      return false;
    }
  }, []);

  // Efecto para manejar autenticación, usando useCallback de loadProfile
  useEffect(() => {
    // Prevenir ejecuciones duplicadas
    if (authInProgressRef.current) return;
    authInProgressRef.current = true;
    
    console.log('[App] useEffect [Auth]: Inicializando gestión de autenticación');
    setLoading(true);

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('[App] getInitialSession: Obteniendo sesión...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log(`[App] getInitialSession: Sesión encontrada para ${session.user.id}`);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log('[App] getInitialSession: No hay sesión activa');
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('[App] getInitialSession: Error:', err);
      } finally {
        setAuthInitialized(true);
        setLoading(false);
      }
    };

    getInitialSession();

    // Suscribirse a cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[App] onAuthStateChange: Evento ${event}`, session?.user ? `para ${session.user.id}` : 'sin sesión');
        
        // Evitar operaciones innecesarias para eventos no relacionados con login/logout
        const isSignificantEvent = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event);
        if (!isSignificantEvent) {
          console.log(`[App] onAuthStateChange: Ignorando evento ${event} (no significativo)`);
          return;
        }
        
        setLoading(true);
        
        if (session?.user) {
          const currentUserId = user?.id || null;
          
          // Solo actualizar user/userProfile si el ID cambió o no hay perfil actual
          if (!currentUserId || currentUserId !== session.user.id || !userProfile) {
            console.log(`[App] onAuthStateChange: Actualizando usuario a ${session.user.id}`);
            setUser(session.user);
            
            // Cargar perfil solo si es un usuario diferente o no hay perfil
            if (!userProfile || currentUserId !== session.user.id) {
              await loadProfile(session.user.id);
            }
          } else {
            console.log(`[App] onAuthStateChange: Usuario ya actualizado (${currentUserId})`);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[App] onAuthStateChange: Limpiando estado por SIGNED_OUT');
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      console.log('[App] useEffect [Auth]: Limpiando suscripción');
      subscription?.unsubscribe();
      authInProgressRef.current = false;
    };
  }, [loadProfile]); // Solo depende de loadProfile (memoizado)

  // Escuchar el evento userProfileUpdated
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail.profile) {
        console.log('[App] Evento userProfileUpdated recibido', event.detail.profile.id);
        setUserProfile(event.detail.profile);
      }
    };
    
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []); // Sin dependencias - solo se ejecuta una vez

  // Usar useMemo para determinar si hay que mostrar la pantalla de carga
  const showLoading = useMemo(() => {
    return loading || !authInitialized;
  }, [loading, authInitialized]);

  if (showLoading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <p className="text-xl">Cargando aplicación...</p>
    </div>;
  }

  // Evitar loggear en cada render
  // console.log('[App] Renderizando. Usuario:', user ? user.id : 'null', 'Perfil:', userProfile ? userProfile.id : 'null');

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Nav user={userProfile} />
        <main className="flex-grow pt-14 bg-white dark:bg-gray-800 shadow-md">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/explore" element={<ExploreBusinesses />} />
            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                <ProfileDashboard user={userProfile} />
              </ProtectedRoute>
            } />
            <Route path="/business/register" element={
              <ProtectedRoute user={user}>
                <BusinessRegister user={userProfile} />
              </ProtectedRoute>
            } />
            <Route path="/business/dashboard" element={
              <ProtectedRoute user={user}>
                <BusinessDashboard user={userProfile} />
              </ProtectedRoute>
            } />
            <Route path="/:slug" element={<BusinessPublicPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 