// frontend/src/controllers/useDeliveryController.ts
import { useState, useEffect, useCallback } from 'react';
import { DeliveryModel } from '../models/DeliveryModel';
import type { ClientDelivery, DeliveryEstimate } from '../models/DeliveryModel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryPagination {
  total: number;
  page: number;
  limit: number;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export function useDeliveryController() {
  const [deliveries, setDeliveries] = useState<ClientDelivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<ClientDelivery | null>(null);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [pagination, setPagination] = useState<DeliveryPagination>({ total: 0, page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
    return typeof raw === 'string' ? raw : fallback;
  };

  // ── Estimate ────────────────────────────────────────────────────────────────

  const getEstimate = useCallback(async (data: {
    pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number;
  }) => {
    setIsEstimating(true);
    setError(null);
    try {
      const res = await DeliveryModel.estimate(data);
      const est = res.data.data as DeliveryEstimate;
      setEstimate(est);
      return est;
    } catch (e) {
      setError(extractError(e, 'Estimation failed'));
      return null;
    } finally {
      setIsEstimating(false);
    }
  }, []);

  // ── Create ──────────────────────────────────────────────────────────────────

  const createDelivery = useCallback(async (data: Partial<ClientDelivery>) => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await DeliveryModel.create(data);
      const created = res.data.data as ClientDelivery;
      setDeliveries(prev => [created, ...prev]);
      return created;
    } catch (e) {
      setError(extractError(e, 'Failed to create delivery'));
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // ── Load all ────────────────────────────────────────────────────────────────

  const loadDeliveries = useCallback(async (params: { status?: string; page?: number; limit?: number } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await DeliveryModel.getAll(params);
      setDeliveries(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch deliveries'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load one ────────────────────────────────────────────────────────────────

  const loadDelivery = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await DeliveryModel.getOne(id);
      const delivery = res.data.data as ClientDelivery;
      setSelectedDelivery(delivery);
      return delivery;
    } catch (e) {
      setError(extractError(e, 'Failed to fetch delivery'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load client-specific (agency-created, fully populated) ─────────────────

  const loadClientDelivery = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await DeliveryModel.getClientOne(id);
      const delivery = res.data.data as ClientDelivery;
      setSelectedDelivery(delivery);
      return delivery;
    } catch (e) {
      setError(extractError(e, 'Failed to fetch delivery'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Cancel ──────────────────────────────────────────────────────────────────

  const cancelDelivery = useCallback(async (id: string) => {
    try {
      const res = await DeliveryModel.cancel(id);
      const updated = res.data.data as ClientDelivery;
      setDeliveries(prev => prev.map(d => (d._id === updated._id ? updated : d)));
      setSelectedDelivery(prev => (prev?._id === updated._id ? updated : prev));
      return updated;
    } catch (e) {
      setError(extractError(e, 'Failed to cancel delivery'));
      return null;
    }
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearEstimate = useCallback(() => setEstimate(null), []);
  const clearError = useCallback(() => setError(null), []);
  const clearSelected = useCallback(() => setSelectedDelivery(null), []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  return {
    // State
    deliveries,
    selectedDelivery,
    estimate,
    pagination,
    isLoading,
    isEstimating,
    isCreating,
    error,
    // Actions
    getEstimate,
    createDelivery,
    loadDeliveries,
    loadDelivery,
    loadClientDelivery,
    cancelDelivery,
    // Helpers
    clearEstimate,
    clearError,
    clearSelected,
  };
}
