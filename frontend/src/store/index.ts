// ============================================================
// STORE — Redux store configuration
// ============================================================
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/auth.slice';

// Import existing slices from original project
let existingReducers = {};
try {
  const authSlice = require('./slices/authSlice').default;
  existingReducers = { authLegacy: authSlice };
} catch { /* not found */ }

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: process.env.NODE_ENV === 'development',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
