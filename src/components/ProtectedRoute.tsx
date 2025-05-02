import { Navigate } from 'react-router-dom';

type ProtectedRouteProps = {
  user: any; // El usuario ya viene verificado desde App.tsx
  children: JSX.Element;
};

const ProtectedRoute = ({ user, children }: ProtectedRouteProps) => {
  // Si el usuario no existe (pasado desde App), redirigir
  if (!user) {
    return <Navigate to="/login" replace />; // replace evita añadir al historial
  }

  // Si el usuario existe, renderizar el componente hijo
  return children;
};

export default ProtectedRoute; 
