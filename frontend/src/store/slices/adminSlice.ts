import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// ─── Delivery types ───────────────────────────────────────────────────────────

export type AdminDeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface AdminDeliveryUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AdminDelivery {
  _id: string;
  orderId?: string;
  clientStatus: AdminDeliveryStatus;
  client?: AdminDeliveryUser;
  driver?: AdminDeliveryUser;
  pickupLat?: number;
  pickupLng?: number;
  pickupLabel?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  dropoffLabel?: string;
  packageType?: string;
  estimatedPrice?: number;
  distance_km?: number;
  eta_minutes?: number;
  notes?: string;
  desiredDate?: string;
  completed_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  delivering: number;
  delivered: number;
  revenue: number;
}

// ─── Admin user types ─────────────────────────────────────────────────────────

// Types
export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  role: 'user' | 'admin' | 'developer';
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  activeApiSettings?: {
    _id: string;
    totalCredits: number;
    usedCredits: number;
    totalRequests: number;
    successfulRequestsCount: number;
    failedRequestsCount: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    concurrentRequests: number;
  };
}

export type I18nString = string | { en?: string; ar?: string };

export interface AdminNotification {
  _id: string;
  title: I18nString;
  message: I18nString;
  type: 'success' | 'error' | 'warning' | 'info';
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  global: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  users: {
    total: number;
    admins: number;
    regular: number;
    recentSignups: number;
  };
  tiers: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
  notifications: {
    unread: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AdminState {
  users: AdminUser[];
  selectedUser: AdminUser | null;
  notifications: AdminNotification[];
  stats: AdminStats | null;
  pagination: Pagination | null;
  notificationsPagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  impersonationToken: string | null;
  // Deliveries
  deliveries: AdminDelivery[];
  deliveryStats: DeliveryStats | null;
  deliveryPagination: Pagination | null;
  deliveriesLoading: boolean;
  deliveriesError: string | null;
}

const initialState: AdminState = {
  users: [],
  selectedUser: null,
  notifications: [],
  stats: null,
  pagination: null,
  notificationsPagination: null,
  isLoading: false,
  error: null,
  impersonationToken: null,
  // Deliveries
  deliveries: [],
  deliveryStats: null,
  deliveryPagination: null,
  deliveriesLoading: false,
  deliveriesError: null,
};

// Async thunks
export const fetchAdminStats = createAsyncThunk(
  'admin/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/admin/stats');
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to fetch admin stats';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (params: { page?: number; limit?: number; search?: string; role?: string; tier?: string } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search, role, tier } = params;
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (search) queryParams.append('search', search);
      if (role) queryParams.append('role', role);
      if (tier) queryParams.append('tier', tier);
      
      const response = await api.get(`/v1/admin/users?${queryParams.toString()}`);
      return { data: response.data.data.users ?? [], pagination: response.data.data.pagination };
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to fetch users';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'admin/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/v1/admin/users/${userId}`);
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to fetch user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, data }: { userId: string; data: Partial<AdminUser> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/v1/admin/users/${userId}`, data);
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }: { userId: string; role: 'user' | 'admin' }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/v1/admin/users/${userId}/role`, { role });
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update user role';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUserApiSettings = createAsyncThunk(
  'admin/updateUserApiSettings',
  async ({ userId, settings }: { userId: string; settings: { totalCredits?: number; requestsPerMinute?: number; requestsPerHour?: number; requestsPerDay?: number } }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/v1/admin/users/${userId}/api-settings`, settings);
      return { userId, settings: response.data.data };
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update API settings';
      return rejectWithValue(errorMessage);
    }
  }
);

export const impersonateUser = createAsyncThunk(
  'admin/impersonateUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/v1/admin/users/${userId}/impersonate`);
      return { token: response.data.data.token };
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to impersonate user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/v1/admin/users/${userId}`);
      return userId;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchAdminNotifications = createAsyncThunk(
  'admin/fetchNotifications',
  async (params: { page?: number; limit?: number; type?: string; global?: string; userRole?: string } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, type, global, userRole } = params;
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (type) queryParams.append('type', type);
      if (userRole) queryParams.append('userRole', userRole);
      else if (global !== undefined) queryParams.append('global', global);
      
      const response = await api.get(`/v1/admin/notifications?${queryParams.toString()}`);
      return { data: response.data.data.notifications ?? [], pagination: response.data.data.pagination };
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to fetch notifications';
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendNotification = createAsyncThunk(
  'admin/sendNotification',
  async (data: { title: string; message: string; type?: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/v1/admin/notifications/send', data);
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send notification';
      return rejectWithValue(errorMessage);
    }
  }
);

export const broadcastNotification = createAsyncThunk(
  'admin/broadcastNotification',
  async (data: { title: string; message: string; type?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/v1/admin/notifications/broadcast', data);
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to broadcast notification';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteAdminNotification = createAsyncThunk(
  'admin/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/v1/admin/notifications/${notificationId}`);
      return notificationId;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete notification';
      return rejectWithValue(errorMessage);
    }
  }
);

// ─── Delivery thunks ─────────────────────────────────────────────────────────

export const fetchAdminDeliveries = createAsyncThunk(
  'admin/fetchDeliveries',
  async (
    params: { page?: number; limit?: number; status?: string; search?: string; date?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, limit = 10, status, search, date } = params;
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) q.append('status', status);
      if (search) q.append('search', search);
      if (date)   q.append('date', date);
      const response = await api.get(`/v1/admin/deliveries?${q.toString()}`);
      return { data: response.data.data.deliveries ?? [], pagination: response.data.data.pagination };
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Erreur lors du chargement des commandes';
      return rejectWithValue(msg);
    }
  }
);

export const fetchDeliveryStats = createAsyncThunk(
  'admin/fetchDeliveryStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/admin/deliveries/stats');
      return response.data.data as DeliveryStats;
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Erreur lors du chargement des statistiques';
      return rejectWithValue(msg);
    }
  }
);

export const updateAdminDelivery = createAsyncThunk(
  'admin/updateDelivery',
  async (
    { id, status, driverId }: { id: string; status?: string; driverId?: string | null },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(`/v1/admin/deliveries/${id}`, { status, driverId });
      return response.data.data as AdminDelivery;
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Erreur lors de la mise à jour';
      return rejectWithValue(msg);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearImpersonationToken: (state) => {
      state.impersonationToken = null;
    },
    // Socket.IO — push a brand-new delivery to the top of the list
    deliveryAdded: (state, action: PayloadAction<AdminDelivery>) => {
      state.deliveries.unshift(action.payload);
      if (state.deliveryStats) state.deliveryStats.total += 1;
      if (state.deliveryStats && action.payload.clientStatus === 'pending') {
        state.deliveryStats.pending += 1;
      }
    },
    // Socket.IO — update an existing delivery in the list
    deliveryUpdated: (state, action: PayloadAction<AdminDelivery>) => {
      const idx = state.deliveries.findIndex(d => d._id === action.payload._id);
      if (idx !== -1) state.deliveries[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Admin Stats
    builder.addCase(fetchAdminStats.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAdminStats.fulfilled, (state, action: PayloadAction<AdminStats>) => {
      state.isLoading = false;
      state.stats = action.payload;
    });
    builder.addCase(fetchAdminStats.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch All Users
    builder.addCase(fetchAllUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAllUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = action.payload.data;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchAllUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch User By ID
    builder.addCase(fetchUserById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserById.fulfilled, (state, action: PayloadAction<AdminUser>) => {
      state.isLoading = false;
      state.selectedUser = action.payload;
    });
    builder.addCase(fetchUserById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update User
    builder.addCase(updateUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action: PayloadAction<AdminUser>) => {
      state.isLoading = false;
      state.selectedUser = action.payload;
      const index = state.users.findIndex(u => u._id === action.payload._id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update User Role
    builder.addCase(updateUserRole.fulfilled, (state, action: PayloadAction<AdminUser>) => {
      const index = state.users.findIndex(u => u._id === action.payload._id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.selectedUser?._id === action.payload._id) {
        state.selectedUser = action.payload;
      }
    });

    // Update User API Settings
    builder.addCase(updateUserApiSettings.fulfilled, (state, action) => {
      const { userId, settings } = action.payload;
      const user = state.users.find(u => u._id === userId);
      if (user && user.activeApiSettings) {
        user.activeApiSettings = { ...user.activeApiSettings, ...settings };
      }
      if (state.selectedUser?._id === userId && state.selectedUser.activeApiSettings) {
        state.selectedUser.activeApiSettings = { ...state.selectedUser.activeApiSettings, ...settings };
      }
    });

    // Impersonate User
    builder.addCase(impersonateUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(impersonateUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.impersonationToken = action.payload.token;
    });
    builder.addCase(impersonateUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Delete User
    builder.addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(u => u._id !== action.payload);
      if (state.selectedUser?._id === action.payload) {
        state.selectedUser = null;
      }
    });

    // Fetch Admin Notifications
    builder.addCase(fetchAdminNotifications.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAdminNotifications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.notifications = action.payload.data;
      state.notificationsPagination = action.payload.pagination;
    });
    builder.addCase(fetchAdminNotifications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Send Notification
    builder.addCase(sendNotification.fulfilled, (state, action: PayloadAction<AdminNotification>) => {
      state.notifications.unshift(action.payload);
    });

    // Broadcast Notification
    builder.addCase(broadcastNotification.fulfilled, (state, action: PayloadAction<AdminNotification>) => {
      state.notifications.unshift(action.payload);
    });

    // Delete Notification
    builder.addCase(deleteAdminNotification.fulfilled, (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n._id !== action.payload);
    });

    // ── Deliveries ─────────────────────────────────────────────────────────

    builder.addCase(fetchAdminDeliveries.pending, (state) => {
      state.deliveriesLoading = true;
      state.deliveriesError   = null;
    });
    builder.addCase(fetchAdminDeliveries.fulfilled, (state, action) => {
      state.deliveriesLoading  = false;
      state.deliveries         = action.payload.data;
      state.deliveryPagination = action.payload.pagination;
    });
    builder.addCase(fetchAdminDeliveries.rejected, (state, action) => {
      state.deliveriesLoading = false;
      state.deliveriesError   = action.payload as string;
    });

    builder.addCase(fetchDeliveryStats.fulfilled, (state, action: PayloadAction<DeliveryStats>) => {
      state.deliveryStats = action.payload;
    });

    builder.addCase(updateAdminDelivery.fulfilled, (state, action: PayloadAction<AdminDelivery>) => {
      const idx = state.deliveries.findIndex(d => d._id === action.payload._id);
      if (idx !== -1) state.deliveries[idx] = action.payload;
    });

  },
});

export const {
  clearError,
  clearSelectedUser,
  clearImpersonationToken,
  deliveryAdded,
  deliveryUpdated,
} = adminSlice.actions;
export default adminSlice.reducer;
