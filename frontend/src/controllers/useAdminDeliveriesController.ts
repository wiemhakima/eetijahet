// frontend/src/controllers/useAdminDeliveriesController.ts
import { useState, useEffect, useCallback } from 'react';
import { AdminDeliveryModel } from '../models/AdminModel';
import type { AdminDelivery, DeliveryStats, Pagination } from '../models/AdminModel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveriesParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  date?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export function useAdminDeliveriesController() {
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
    return raw ?? fallback;
  };

  const loadDeliveries = useCallback(async (params: DeliveriesParams = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminDeliveryModel.getAll(params);
      setDeliveries(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      setError(extractError(e, 'Erreur lors du chargement des commandes'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await AdminDeliveryModel.getStats();
      setDeliveryStats(res.data.data as DeliveryStats);
    } catch (e) {
      setError(extractError(e, 'Erreur lors du chargement des statistiques'));
    }
  }, []);

  const updateDelivery = useCallback(async (id: string, data: { status?: string; driverId?: string | null }) => {
    try {
      const res = await AdminDeliveryModel.update(id, data);
      const updated = res.data.data as AdminDelivery;
      setDeliveries(prev => prev.map(d => (d._id === updated._id ? updated : d)));
      return updated;
    } catch (e) {
      setError(extractError(e, 'Erreur lors de la mise à jour'));
      return null;
    }
  }, []);

  // Socket.IO helpers — call these from your socket event handlers
  // e.g. socket.on('delivery:new', (delivery) => pushDelivery(delivery))
  const pushDelivery = useCallback((delivery: AdminDelivery) => {
    setDeliveries(prev => [delivery, ...prev]);
    setDeliveryStats(prev =>
      prev
        ? {
            ...prev,
            total: prev.total + 1,
            pending: delivery.clientStatus === 'pending' ? prev.pending + 1 : prev.pending,
          }
        : prev
    );
  }, []);

  // e.g. socket.on('delivery:updated', (delivery) => patchDelivery(delivery))
  const patchDelivery = useCallback((delivery: AdminDelivery) => {
    setDeliveries(prev => prev.map(d => (d._id === delivery._id ? delivery : d)));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    loadDeliveries();
    loadStats();
  }, [loadDeliveries, loadStats]);

  return {
    // State
    deliveries,
    deliveryStats,
    pagination,
    isLoading,
    error,
    // Actions
    loadDeliveries,
    loadStats,
    updateDelivery,
    // Socket.IO helpers
    pushDelivery,
    patchDelivery,
    // Helpers
    clearError,
  };
}
