// ============================================================
// AUTH SERVICE — All auth-related API calls
// ============================================================
import http from './http.service';
import type { ApiResponse, User } from '../../models';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  agreeMarketing?: boolean;
  role?: string;
}

export interface RegisterAgencyPayload {
  agencyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  plan: string;
}

export interface AuthTokenResponse {
  token: string;
  data: User;
  message?: string;
}

const AuthService = {
  login: (payload: LoginPayload) =>
    http.post<ApiResponse<AuthTokenResponse>>('/v1/auth/login', payload),

  signup: (payload: SignupPayload) =>
    http.post<ApiResponse<AuthTokenResponse>>('/v1/auth/signup', payload),

  registerAgency: (payload: RegisterAgencyPayload) =>
    http.post<ApiResponse<{ owner: User; token: string }>>('/v1/agencies/register', payload),

  loginWithCode: (email: string, code: string) =>
    http.post<ApiResponse<AuthTokenResponse>>('/v1/auth/login-code', { email, code }),

  resendCode: (email: string) =>
    http.post('/v1/auth/resend-code', { email }),

  me: () =>
    http.get<ApiResponse<User>>('/v1/auth/me'),

  updateProfile: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'company' | 'agreeMarketing'>>) =>
    http.put<ApiResponse<User>>('/v1/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    http.put('/v1/auth/password', { currentPassword, newPassword }),

  logout: () =>
    http.post('/v1/auth/logout'),

  forgotPassword: (email: string) =>
    http.post('/v1/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    http.post(`/v1/auth/reset-password/${token}`, { password }),
};

export default AuthService;
