import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// Define response types
export interface AuthResponse {
  token: string;
  data: User;
  message?: string;
}

// Define types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  avatar?: string;
  agreeMarketing: boolean;
  role: string;
  agency?: string;
  maximumRequests: number;
  tier: string;
  createdAt: string;
  updatedAt: string;
  teamRole?: 'admin' | 'manager';
  permissions?: {
    merchants?: boolean;
    drivers?: boolean;
    deliveries?: boolean;
    statistics?: boolean;
    finances?: boolean;
    settings?: boolean;
    team?: boolean;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean; // Flag to indicate session was expired
}

// Initial state
const hasToken = !!localStorage.getItem('token');
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: hasToken,
  isLoading: hasToken,
  error: null,
  sessionExpired: false,
};

// Async thunks
export const signup = createAsyncThunk(
  'auth/signup',
  async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    company?: string;
    recaptchaToken?: string | null;
    agreeMarketing?: boolean;
    role?: string;
  }, { rejectWithValue }) => {
    try {
      // Remove confirmPassword as it's not needed in the API
      const { confirmPassword, ...apiData } = userData;
      void confirmPassword; // Explicitly mark as used
      const response = await api.post('/v1/auth/signup', apiData);
      
      // Store token in localStorage if successful
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error: unknown) {
      const raw = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      const errorMessage = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : 'Signup failed');
      return rejectWithValue(errorMessage);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (loginData: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }, { rejectWithValue }) => {
    try {
      // Remove rememberMe as it's not needed in the API
      const { rememberMe, ...apiData } = loginData;
      void rememberMe; // Explicitly mark as used
      const response = await api.post('/v1/auth/login', apiData);
      
      // Store token in localStorage if successful
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/auth/me');
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to get user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Call server logout endpoint if token exists
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/v1/auth/logout');
      }
      
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonating');
      
      return { message: 'Logged out successfully' };
    } catch (error: unknown) {
      // Even if server logout fails, we should clear local storage
      console.error('Server logout failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonating');
      
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Logout failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerAgency = createAsyncThunk(
  'auth/registerAgency',
  async (agencyData: {
    agencyName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    plan: string;
    recaptchaToken?: string | null;
  }, { rejectWithValue }) => {
    try {
      const { recaptchaToken: _rc, ...apiData } = agencyData;
      void _rc;
      const response = await api.post('/v1/agencies/register', apiData);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.owner));
      }

      return {
        token: response.data.token,
        data: response.data.data.owner,
      } as AuthResponse;
    } catch (error: unknown) {
      const raw = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      const errorMessage = Array.isArray(raw)
        ? raw.join(', ')
        : typeof raw === 'string'
        ? raw
        : 'Agency registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { firstName?: string; lastName?: string; company?: string; agreeMarketing?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.put('/v1/auth/profile', profileData);
      // Update localStorage
      if (response.data.data) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update profile';
      return rejectWithValue(errorMessage);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await api.put('/v1/auth/password', passwordData);
      // Update token if returned
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password';
      return rejectWithValue(errorMessage);
    }
  }
);

// Set impersonation token and fetch the impersonated user
// This uses sessionStorage (tab-specific) so it doesn't affect the admin's session in other tabs
export const setImpersonationToken = createAsyncThunk(
  'auth/setImpersonationToken',
  async (token: string, { rejectWithValue }) => {
    try {
      // DO NOT modify localStorage - it's shared across all tabs
      // sessionStorage is already set by the Impersonate page component
      // The API client will automatically use the impersonate_token from sessionStorage
      
      // Fetch the user associated with this token to verify it's valid
      const response = await api.get('/v1/auth/me');
      
      // Store user in sessionStorage for this tab only
      sessionStorage.setItem('impersonate_user', JSON.stringify(response.data.data));
      
      return { token, user: response.data.data };
    } catch (error: unknown) {
      // If token is invalid, clear sessionStorage
      sessionStorage.removeItem('impersonate_token');
      sessionStorage.removeItem('impersonating');
      sessionStorage.removeItem('impersonate_user');
      
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid impersonation token';
      return rejectWithValue(errorMessage);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.sessionExpired = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSessionExpired: (state) => {
      state.sessionExpired = false;
    },
  },
  extraReducers: (builder) => {
    // Signup
    builder.addCase(signup.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signup.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.data;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(signup.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register agency
    builder.addCase(registerAgency.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerAgency.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.data;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(registerAgency.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.data;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get current user
    builder.addCase(getCurrentUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(getCurrentUser.rejected, (state) => {
      state.isLoading = false;
      // Clear authentication state when token is invalid/expired
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      // Don't set error - use sessionExpired flag instead for better UX
      state.error = null;
      state.sessionExpired = true;
      // Clear invalid token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    // Logout user
    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isLoading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.isLoading = false;
      // Even if logout fails, clear the auth state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = action.payload as string;
    });

    // Update profile
    builder.addCase(updateProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Change password
    builder.addCase(changePassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload.token) {
        state.token = action.payload.token;
      }
      state.error = null;
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Set impersonation token
    builder.addCase(setImpersonationToken.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(setImpersonationToken.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(setImpersonationToken.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload as string;
    });
  },
});

// Export actions and reducer
export const { logout, clearError, clearSessionExpired } = authSlice.actions;
export default authSlice.reducer;
