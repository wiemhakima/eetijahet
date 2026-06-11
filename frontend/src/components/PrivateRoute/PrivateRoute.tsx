import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface PrivateRouteProps {
  redirectPath?: string;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ redirectPath = '/login', allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAppSelector(state => state.auth);
  const location = useLocation();

  // Show nothing while authentication is being verified
  if (isLoading) {
    return null;
  }

  // Redirect to login if not authenticated or user data not loaded
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} replace />;
  }

  // Role-based protection: if allowedRoles specified and user's role not in list
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the correct dashboard for their role
    if (user.role === 'agency_admin' || user.role === 'gestionnaire_agency') return <Navigate to="/agency/dashboard" replace />;
    if (user.role === 'admin' || user.role === 'developer') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Guard /agency/* routes — agency roles only
  if (location.pathname.startsWith('/agency/') && !['agency_admin', 'gestionnaire_agency'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Guard /admin/* routes — only admin/developer allowed
  if (location.pathname.startsWith('/admin/') && !['admin', 'developer'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
