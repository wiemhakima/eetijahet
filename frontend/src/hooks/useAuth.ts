// ============================================================
// useAuth HOOK — Access auth state & controller actions
// ============================================================
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import AuthController from '../controllers/auth.controller';
import { clearError, clearSessionExpired } from '../store/slices/auth.slice';
import type { LoginPayload, SignupPayload, RegisterAgencyPayload } from '../services/api/auth.service';
import type { UserRole } from '../models';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading, error, sessionExpired } =
    useAppSelector((state) => state.auth);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await dispatch(AuthController.login(payload));
      if ((result as { success: boolean }).success) {
        // Redirect based on role
        const role = (result as { user?: { role: UserRole } }).user?.role;
        redirectByRole(role, navigate);
      }
      return result;
    },
    [dispatch, navigate]
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const result = await dispatch(AuthController.signup(payload));
      if ((result as { success: boolean }).success) {
        navigate('/dashboard');
      }
      return result;
    },
    [dispatch, navigate]
  );

  const registerAgency = useCallback(
    async (payload: RegisterAgencyPayload) => {
      const result = await dispatch(AuthController.registerAgency(payload));
      if ((result as { success: boolean }).success) {
        navigate('/agency/dashboard');
      }
      return result;
    },
    [dispatch, navigate]
  );

  const logout = useCallback(async () => {
    await dispatch(AuthController.logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const updateProfile = useCallback(
    (data: Parameters<typeof AuthController.updateProfile>[0]) =>
      dispatch(AuthController.updateProfile(data)),
    [dispatch]
  );

  const handleClearError = useCallback(() => dispatch(clearError()), [dispatch]);
  const handleClearSessionExpired = useCallback(() => dispatch(clearSessionExpired()), [dispatch]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user]
  );

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    sessionExpired,
    login,
    signup,
    registerAgency,
    logout,
    updateProfile,
    clearError: handleClearError,
    clearSessionExpired: handleClearSessionExpired,
    hasRole,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isAgencyAdmin: user?.role === 'agency_admin',
    isDriver: user?.role === 'driver',
    isMerchant: user?.role === 'merchant',
    isDeveloper: user?.role === 'developer',
  };
};

// Helper: redirect to the right dashboard after login
function redirectByRole(role: UserRole | undefined, navigate: ReturnType<typeof useNavigate>) {
  const routes: Record<UserRole, string> = {
    admin: '/dashboard',
    super_admin: '/dashboard',
    agency_admin: '/agency/dashboard',
    driver: '/driver/dashboard',
    merchant: '/merchant/dashboard',
    developer: '/developer/dashboard',
    user: '/client/dashboard',
  };
  navigate(role ? (routes[role] ?? '/dashboard') : '/dashboard');
}

export default useAuth;
