import axios from 'axios';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Check for impersonation token in sessionStorage first (tab-specific)
    // This allows impersonation to work in a separate tab without affecting the admin's session
    const impersonateToken = sessionStorage.getItem('impersonate_token');
    
    // Use impersonation token if available, otherwise fall back to regular token
    const token = impersonateToken || localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors here (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      console.error('Unauthorized access');
      // Example: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
