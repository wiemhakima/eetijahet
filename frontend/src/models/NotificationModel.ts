// frontend/src/models/NotificationModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type I18nString = string | { en?: string; ar?: string };

export interface Notification {
  _id: string;
  title: I18nString;
  message: I18nString;
  type: 'success' | 'error' | 'warning' | 'info';
  user?: string;
  global: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  image?: string;
  content?: string;
  link?: string;
}

export type NotificationsFilter = {
  type?: 'success' | 'error' | 'warning' | 'info' | 'all';
  isRead?: boolean | 'all';
  read?: boolean | 'all';
  timeRange?: 'today' | 'week' | 'month' | 'all';
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
};

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  page: number;
  pages: number;
  total: number;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const NotificationModel = {
  getAll: () =>
    api.get('/v1/notifications'),

  getOne: (notificationId: string) =>
    api.get(`/v1/notifications/${notificationId}`),

  markAsRead: (notificationId: string) =>
    api.put(`/v1/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.put('/v1/notifications/read-all'),

  remove: (notificationId: string) =>
    api.delete(`/v1/notifications/${notificationId}`),
};
