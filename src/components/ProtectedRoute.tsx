import { Navigate } from 'react-router-dom';
import React from 'react';
import { ROLES } from '../lib/roles';
import type { Role } from '../lib/roles';

type ProtectedRouteProps = {
  user: any;
  children: React.ReactNode;
  requiredRole?: Role;
  fallbackPath?: string;
};

const ProtectedRoute = ({ user, children, requiredRole, fallbackPath = '/' }: ProtectedRouteProps) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role) {
    const userIdx = ROLES.indexOf(user.role);
    const reqIdx = ROLES.indexOf(requiredRole);

    if (reqIdx !== -1 && userIdx !== -1 && userIdx < reqIdx) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
