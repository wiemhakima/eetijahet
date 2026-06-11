// ============================================================
// AUTH SLICE — Redux state for authentication
// ============================================================
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../../models';

const hasToken = !!localStorage.getItem('token');

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: hasToken,
  isLoading: hasToken, // loading while we verify token
  error: null,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
      state.sessionExpired = false;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    logoutAction: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.sessionExpired = false;
    },
    setSessionExpired: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.sessionExpired = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSessionExpired: (state) => {
      state.sessionExpired = false;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  setUser,
  logoutAction,
  setSessionExpired,
  clearError,
  clearSessionExpired,
} = authSlice.actions;

export default authSlice.reducer;
