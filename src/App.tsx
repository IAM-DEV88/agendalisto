import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

  // Inicialización principal: verificar si hay una sesión activa al cargar
  useEffect(() => {
    // Simplified initial session check without custom timeouts
    const getInitialSession = async () => {
      setLoading(true);
      console.log('Obteniendo sesión inicial...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('Sesión encontrada:', session.user.email);
          setUser(session.user);
          const { success, perfil, error } = await obtenerPerfilUsuario(session.user.id);
          if (success && perfil) {
            console.log('Perfil cargado correctamente');
            setUserProfile(perfil);
          } else {
            console.log('No se pudo cargar el perfil, pero continuando:', error);
          }
        } else {
          console.log('No hay sesión activa');
        }
      } catch (err) {
        console.error('Error obteniendo sesión inicial:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Estado de autenticación cambiado:', event);
        if (session?.user) {
          console.log('Usuario autenticado:', session.user.email);
          setUser(session.user);
          try {
            const { success, perfil, error } = await obtenerPerfilUsuario(session.user.id);
            if (success && perfil) {
              console.log('Perfil cargado en cambio de auth');
              setUserProfile(perfil);
            } else {
              console.log('No se pudo cargar el perfil en cambio de auth:', error);
            }
          } catch (err) {
            console.error('Error al cargar perfil en cambio de auth:', err);
          }
        } else {
          console.log('Usuario desconectado');
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription?.unsubscribe();
      setLoading(false); // Asegurar que no quede en estado de carga al desmontar
    };
  }, []);

  // NUEVO: restaurar sesión al volver al foco
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        console.log('Documento visible, verificando sesión...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && (!user || user.id !== session.user.id)) {
            console.log('Actualizando usuario después de cambio de visibilidad');
            setUser(session.user);
            const { success, perfil } = await obtenerPerfilUsuario(session.user.id);
            if (success && perfil) {
              console.log('Actualizando perfil después de cambio de visibilidad');
              setUserProfile(perfil);
            }
          } else if (!session?.user && user) {
            console.log('Sesión finalizada mientras fuera de foco');
            setUser(null);
            setUserProfile(null);
          }
        } catch (err) {
          console.error('Error al verificar sesión en cambio de visibilidad:', err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, userProfile]);

  // Escuchar el evento userProfileUpdated
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const { user: updatedUser, profile: updatedProfile } = event.detail;
      console.log('Evento userProfileUpdated recibido:', { updatedUser, updatedProfile });
      
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    };

    // Agregar el event listener
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);

    // Limpiar el event listener
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <p className="text-xl">Cargando...</p>
    </div>;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Nav user={userProfile} />
        <main className="flex-grow">
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