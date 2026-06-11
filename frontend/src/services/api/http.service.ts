// ============================================================
// HTTP SERVICE — Axios instance & interceptors
// ============================================================
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const createHttpClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor — attach token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Check impersonation first (tab-specific)
      const impersonateToken = sessionStorage.getItem('impersonate_token');
      const token = impersonateToken || localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor — handle 401
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear tokens on unauthorized
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('impersonate_token');
        sessionStorage.removeItem('impersonating');
        sessionStorage.removeItem('impersonate_user');
        // Redirect to login
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const http = createHttpClient();
export default http;
