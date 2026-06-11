// frontend/src/controllers/useAdminUsersController.ts
import { useState, useEffect, useCallback } from 'react';
import { AdminUsersModel } from '../models/AdminModel';
import type {
  AdminUser,
  AdminNotification,
  AdminStats,
  Pagination,
} from '../models/AdminModel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  tier?: string;
}

interface NotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  global?: string;
  userRole?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export function useAdminUsersController() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [notificationsPagination, setNotificationsPagination] = useState<Pagination | null>(null);
  const [impersonationToken, setImpersonationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
    return raw ?? fallback;
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    try {
      const res = await AdminUsersModel.getStats();
      setStats(res.data.data);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch admin stats'));
    }
  }, []);

  // ── Users ──────────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async (params: UsersParams = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminUsersModel.getAll(params);
      setUsers(res.data.data.users ?? res.data.data);
      setPagination(res.data.data.pagination ?? res.data.pagination);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch users'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminUsersModel.getOne(userId);
      setSelectedUser(res.data.data);
      return res.data.data as AdminUser;
    } catch (e) {
      setError(extractError(e, 'Failed to fetch user'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, data: Partial<AdminUser>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminUsersModel.update(userId, data);
      const updated = res.data.data as AdminUser;
      setSelectedUser(updated);
      setUsers(prev => prev.map(u => (u._id === updated._id ? updated : u)));
      return updated;
    } catch (e) {
      setError(extractError(e, 'Failed to update user'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: 'user' | 'admin') => {
    try {
      const res = await AdminUsersModel.updateRole(userId, role);
      const updated = res.data.data as AdminUser;
      setUsers(prev => prev.map(u => (u._id === updated._id ? updated : u)));
      setSelectedUser(prev => (prev?._id === updated._id ? updated : prev));
      return updated;
    } catch (e) {
      setError(extractError(e, 'Failed to update user role'));
      return null;
    }
  }, []);

  const updateUserApiSettings = useCallback(async (
    userId: string,
    settings: { totalCredits?: number; requestsPerMinute?: number; requestsPerHour?: number; requestsPerDay?: number }
  ) => {
    try {
      const res = await AdminUsersModel.updateApiSettings(userId, settings);
      const updatedSettings = res.data.data;
      setUsers(prev =>
        prev.map(u =>
          u._id === userId && u.activeApiSettings
            ? { ...u, activeApiSettings: { ...u.activeApiSettings, ...updatedSettings } }
            : u
        )
      );
      setSelectedUser(prev =>
        prev?._id === userId && prev.activeApiSettings
          ? { ...prev, activeApiSettings: { ...prev.activeApiSettings, ...updatedSettings } }
          : prev
      );
      return updatedSettings;
    } catch (e) {
      setError(extractError(e, 'Failed to update API settings'));
      return null;
    }
  }, []);

  const impersonateUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminUsersModel.impersonate(userId);
      setImpersonationToken(res.data.token);
      return res.data.token as string;
    } catch (e) {
      setError(extractError(e, 'Failed to impersonate user'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeUser = useCallback(async (userId: string) => {
    try {
      await AdminUsersModel.remove(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setSelectedUser(prev => (prev?._id === userId ? null : prev));
    } catch (e) {
      setError(extractError(e, 'Failed to delete user'));
    }
  }, []);

  // ── Notifications ──────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async (params: NotificationsParams = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminUsersModel.getNotifications(params);
      setNotifications(res.data.data.notifications ?? res.data.data);
      setNotificationsPagination(res.data.data.pagination ?? res.data.pagination);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendNotification = useCallback(async (data: { title: string; message: string; type?: string; userId: string }) => {
    try {
      const res = await AdminUsersModel.sendNotification(data);
      const created = res.data.data as AdminNotification;
      setNotifications(prev => [created, ...prev]);
      return created;
    } catch (e) {
      setError(extractError(e, 'Failed to send notification'));
      return null;
    }
  }, []);

  const broadcastNotification = useCallback(async (data: { title: string; message: string; type?: string }) => {
    try {
      const res = await AdminUsersModel.broadcastNotification(data);
      const created = res.data.data as AdminNotification;
      setNotifications(prev => [created, ...prev]);
      return created;
    } catch (e) {
      setError(extractError(e, 'Failed to broadcast notification'));
      return null;
    }
  }, []);

  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      await AdminUsersModel.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (e) {
      setError(extractError(e, 'Failed to delete notification'));
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);
  const clearSelectedUser = useCallback(() => setSelectedUser(null), []);
  const clearImpersonationToken = useCallback(() => setImpersonationToken(null), []);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers, loadStats]);

  return {
    // State
    users,
    selectedUser,
    notifications,
    stats,
    pagination,
    notificationsPagination,
    impersonationToken,
    isLoading,
    error,
    // Stats
    loadStats,
    // User actions
    loadUsers,
    loadUser,
    updateUser,
    updateUserRole,
    updateUserApiSettings,
    impersonateUser,
    removeUser,
    // Notification actions
    loadNotifications,
    sendNotification,
    broadcastNotification,
    removeNotification,
    // Helpers
    clearError,
    clearSelectedUser,
    clearImpersonationToken,
  };
}
