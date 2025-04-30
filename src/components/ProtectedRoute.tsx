import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type ProtectedRouteProps = {
  user: any;
  children: JSX.Element;
};

const ProtectedRoute = ({ user, children }: ProtectedRouteProps) => {
  const [checking, setChecking] = useState(!user);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  // Verificación adicional de autenticación si no hay usuario en las props
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        try {
          console.log('Verificando autenticación en ProtectedRoute...');
          const { data: { session } } = await supabase.auth.getSession();
          const authenticated = !!session?.user;
          console.log('Estado de autenticación:', authenticated ? 'autenticado' : 'no autenticado');
          setIsAuthenticated(authenticated);
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          setIsAuthenticated(false);
        } finally {
          setChecking(false);
        }
      } else {
        // Si ya hay usuario en las props, no es necesario verificar
        setIsAuthenticated(true);
        setChecking(false);
      }
    };

    checkAuth();
  }, [user]);

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-xl">Verificando autenticación...</p>
      </div>
    );
  }

  // Redireccionar a login si no está autenticado
  if (!isAuthenticated) {
    console.log('Usuario no autenticado, redirigiendo a /login');
    return <Navigate to="/login" />;
  }

  // Renderizar el componente hijo si está autenticado
  return children;
};

export default ProtectedRoute; 