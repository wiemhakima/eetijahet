// ============================================================
// AUTH CONTROLLER — Business logic for authentication
// Bridges Views ↔ Services, dispatches to Store
// ============================================================
import { AppDispatch } from '../store';
import {
  loginStart, loginSuccess, loginFailure,
  logoutAction, setUser, setSessionExpired,
} from '../store/slices/auth.slice';
import AuthService from '../services/api/auth.service';
import type { LoginPayload, SignupPayload, RegisterAgencyPayload } from '../services/api/auth.service';
import socketService from '../services/socket/socket.service';

const AuthController = {
  login: (payload: LoginPayload) => async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());
      const res = await AuthService.login(payload);
      const { token, data } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data));
      dispatch(loginSuccess({ token, user: data }));
      // Connect socket after login
      socketService.connect(token);
      return { success: true };
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Login failed';
      dispatch(loginFailure(msg));
      return { success: false, error: msg };
    }
  },

  signup: (payload: SignupPayload) => async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());
      const { confirmPassword: _cp, ...apiData } = payload as SignupPayload & { confirmPassword?: string };
      void _cp;
      const res = await AuthService.signup(apiData);
      const { token, data } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data));
      dispatch(loginSuccess({ token, user: data }));
      socketService.connect(token);
      return { success: true };
    } catch (error: unknown) {
      const raw = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : 'Signup failed');
      dispatch(loginFailure(msg));
      return { success: false, error: msg };
    }
  },

  registerAgency: (payload: RegisterAgencyPayload) => async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());
      const res = await AuthService.registerAgency(payload);
      const token = res.data.data.token;
      const user = res.data.data.owner;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch(loginSuccess({ token, user }));
      socketService.connect(token);
      return { success: true };
    } catch (error: unknown) {
      const raw = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : 'Registration failed');
      dispatch(loginFailure(msg));
      return { success: false, error: msg };
    }
  },

  loadCurrentUser: () => async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());
      const res = await AuthService.me();
      dispatch(setUser(res.data.data));
      // Reconnect socket if needed
      const token = localStorage.getItem('token');
      if (token) socketService.connect(token);
    } catch {
      dispatch(setSessionExpired());
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  logout: () => async (dispatch: AppDispatch) => {
    try {
      await AuthService.logout();
    } catch {
      // Ignore server error, still logout locally
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonating');
      socketService.disconnect();
      dispatch(logoutAction());
    }
  },

  updateProfile: (data: Parameters<typeof AuthService.updateProfile>[0]) =>
    async (dispatch: AppDispatch) => {
      try {
        const res = await AuthService.updateProfile(data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        dispatch(setUser(res.data.data));
        return { success: true };
      } catch (error: unknown) {
        const msg = (error as { response?: { data?: { error?: string } } })
          ?.response?.data?.error || 'Update failed';
        return { success: false, error: msg };
      }
    },
};

export default AuthController;
