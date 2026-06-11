// frontend/src/controllers/useNotificationController.ts
//
// NOTE — Socket.IO real-time push:
// The original Redux slice contained an `addNotification` reducer that was
// called from a socket.io event handler (e.g. `socket.on('notification', ...)`).
// In this controller, the equivalent is the `pushNotification` helper below.
// Wire it up in your socket service:
//
//   socket.on('notification', (notification: Notification) => {
//     // call the returned `pushNotification` from this hook
//   });
//
// Because hooks can't be called from outside React, the recommended pattern
// is to pass `pushNotification` down as a callback or use a shared ref/context.

import { useState, useEffect, useCallback } from 'react';
import { NotificationModel } from '../models/NotificationModel';
import type { Notification, NotificationsFilter } from '../models/NotificationModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useNotificationController() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFiltersState] = useState<NotificationsFilter>({
    type: 'all',
    read: 'all',
    isRead: 'all',
    timeRange: 'all',
    page: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error;
    return raw ?? (e as { message?: string })?.message ?? fallback;
  };

  // ── Load all ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NotificationModel.getAll();
      const data = res.data.data as Notification[];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load one ────────────────────────────────────────────────────────────────

  const loadOne = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NotificationModel.getOne(notificationId);
      const data = res.data.data as Notification;
      setSelectedNotification(data);
      return data;
    } catch (e) {
      setError(extractError(e, 'Failed to fetch notification'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Mark as read ────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const res = await NotificationModel.markAsRead(notificationId);
      const updated = res.data.data as Notification;
      setNotifications(prev =>
        prev.map(n => {
          if (n._id !== updated._id) return n;
          return updated;
        })
      );
      // Recalculate unread count
      setNotifications(prev => {
        setUnreadCount(prev.filter(n => !n.isRead).length);
        return prev;
      });
      return updated;
    } catch (e) {
      setError(extractError(e, 'Failed to mark notification as read'));
      return null;
    }
  }, []);

  // ── Mark all as read ────────────────────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationModel.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      setError(extractError(e, 'Failed to mark all notifications as read'));
    }
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────────

  const remove = useCallback(async (notificationId: string) => {
    try {
      await NotificationModel.remove(notificationId);
      setNotifications(prev => {
        const target = prev.find(n => n._id === notificationId);
        const wasUnread = target ? !target.isRead : false;
        const next = prev.filter(n => n._id !== notificationId);
        if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
        return next;
      });
    } catch (e) {
      setError(extractError(e, 'Failed to delete notification'));
    }
  }, []);

  // ── Socket.IO helper ────────────────────────────────────────────────────────
  // Call this when a real-time notification arrives via socket.io:
  //   socket.on('notification', pushNotification)
  const pushNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(c => c + 1);
    }
  }, []);

  // ── Filters ─────────────────────────────────────────────────────────────────

  const setFilters = useCallback((partial: NotificationsFilter) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ type: 'all', read: 'all', timeRange: 'all' });
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);
  const clearSelectedNotification = useCallback(() => setSelectedNotification(null), []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    // State
    notifications,
    selectedNotification,
    unreadCount,
    filters,
    isLoading,
    error,
    // Actions
    load,
    loadOne,
    markAsRead,
    markAllAsRead,
    remove,
    // Socket.IO
    pushNotification,
    // Filters
    setFilters,
    clearFilters,
    // Helpers
    clearError,
    clearSelectedNotification,
    clearNotifications,
  };
}
