// frontend/src/models/AdminModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export type I18nString = string | { en?: string; ar?: string };

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

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── User Model ───────────────────────────────────────────────────────────────

export const AdminUsersModel = {
  getStats: () =>
    api.get('/v1/admin/stats'),

  getAll: (params: { page?: number; limit?: number; search?: string; role?: string; tier?: string } = {}) =>
    api.get('/v1/admin/users', { params }),

  getOne: (userId: string) =>
    api.get(`/v1/admin/users/${userId}`),

  update: (userId: string, data: Partial<AdminUser>) =>
    api.put(`/v1/admin/users/${userId}`, data),

  updateRole: (userId: string, role: 'user' | 'admin') =>
    api.patch(`/v1/admin/users/${userId}/role`, { role }),

  updateApiSettings: (userId: string, settings: {
    totalCredits?: number;
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  }) =>
    api.patch(`/v1/admin/users/${userId}/api-settings`, settings),

  impersonate: (userId: string) =>
    api.post(`/v1/admin/users/${userId}/impersonate`),

  remove: (userId: string) =>
    api.delete(`/v1/admin/users/${userId}`),

  getNotifications: (params: { page?: number; limit?: number; type?: string; global?: string; userRole?: string } = {}) =>
    api.get('/v1/admin/notifications', { params }),

  sendNotification: (data: { title: string; message: string; type?: string; userId: string }) =>
    api.post('/v1/admin/notifications/send', data),

  broadcastNotification: (data: { title: string; message: string; type?: string }) =>
    api.post('/v1/admin/notifications/broadcast', data),

  deleteNotification: (notificationId: string) =>
    api.delete(`/v1/admin/notifications/${notificationId}`),
};

// ─── Delivery Model ───────────────────────────────────────────────────────────

export const AdminDeliveryModel = {
  getAll: (params: { page?: number; limit?: number; status?: string; search?: string; date?: string } = {}) =>
    api.get('/v1/admin/deliveries', { params }),

  getStats: () =>
    api.get('/v1/admin/deliveries/stats'),

  update: (id: string, data: { status?: string; driverId?: string | null }) =>
    api.patch(`/v1/admin/deliveries/${id}`, data),
};
