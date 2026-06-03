import { Navigate } from 'react-router-dom';
import React from 'react';
import { ROLES, PLANS } from '../lib/roles';
import type { Role, Plan } from '../lib/roles';

type ProtectedRouteProps = {
  user: any;
  children: React.ReactNode;
  requiredRole?: Role;
  requiredPlan?: Plan;
  fallbackPath?: string;
  userProfile?: { role?: string; plan?: string } | null;
};

const ProtectedRoute = ({ user, children, requiredRole, requiredPlan, fallbackPath = '/', userProfile }: ProtectedRouteProps) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile?.role) {
    const userIdx = ROLES.indexOf(userProfile.role as Role);
    const reqIdx = ROLES.indexOf(requiredRole);

    if (reqIdx !== -1 && userIdx !== -1 && userIdx < reqIdx) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  if (requiredPlan && userProfile?.plan) {
    const userPlanIdx = PLANS.indexOf(userProfile.plan as Plan);
    const reqPlanIdx = PLANS.indexOf(requiredPlan);

    if (reqPlanIdx !== -1 && userPlanIdx !== -1 && userPlanIdx < reqPlanIdx) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
