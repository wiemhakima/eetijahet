import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import reducers
import counterReducer from './slices/counterSlice';
import authReducer from './slices/authSlice';
import apiKeyReducer from './slices/apiKeySlice';
import usageReducer from './slices/usageSlice';
import logsReducer from './slices/logsSlice';
import notificationsReducer from './slices/notificationsSlice';
import adminReducer from './slices/adminSlice';
import creditsReducer  from './slices/creditsSlice';
import deliveryReducer from './slices/deliverySlice';
import addressReducer  from './slices/addressSlice';
import ratingReducer   from './slices/ratingSlice';
import agencyReducer   from './slices/agencySlice';

export const store = configureStore({
  reducer: {
    counter:       counterReducer,
    auth:          authReducer,
    apiKeys:       apiKeyReducer,
    usage:         usageReducer,
    logs:          logsReducer,
    notifications: notificationsReducer,
    admin:         adminReducer,
    credits:       creditsReducer,
    delivery:      deliveryReducer,
    address:       addressReducer,
    ratings:       ratingReducer,
    agency:        agencyReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
