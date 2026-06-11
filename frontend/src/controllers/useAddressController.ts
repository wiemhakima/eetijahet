// frontend/src/controllers/useAddressController.ts
import { useState, useEffect, useCallback } from 'react';
import { AddressModel } from '../models/AddressModel';
import type { FavoriteAddress } from '../models/AddressModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useAddressController() {
  const [addresses, setAddresses] = useState<FavoriteAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
    return typeof raw === 'string' ? raw : fallback;
  };

  // ── Load all ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AddressModel.getAll();
      setAddresses(res.data.data as FavoriteAddress[]);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch addresses'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Create ──────────────────────────────────────────────────────────────────

  const create = useCallback(async (data: Omit<FavoriteAddress, '_id' | 'createdAt' | 'updatedAt'>) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await AddressModel.create(data);
      const created = res.data.data as FavoriteAddress;
      setAddresses(prev => {
        const next = created.isDefault
          ? prev.map(a => ({ ...a, isDefault: false }))
          : [...prev];
        return [created, ...next];
      });
      return created;
    } catch (e) {
      setError(extractError(e, 'Failed to create address'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ── Update ──────────────────────────────────────────────────────────────────

  const update = useCallback(async (id: string, data: Partial<FavoriteAddress>) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await AddressModel.update(id, data);
      const updated = res.data.data as FavoriteAddress;
      setAddresses(prev => {
        const base = updated.isDefault
          ? prev.map(a => ({ ...a, isDefault: false }))
          : [...prev];
        return base.map(a => (a._id === updated._id ? updated : a));
      });
      return updated;
    } catch (e) {
      setError(extractError(e, 'Failed to update address'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ── Remove ──────────────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string) => {
    try {
      await AddressModel.remove(id);
      setAddresses(prev => prev.filter(a => a._id !== id));
    } catch (e) {
      setError(extractError(e, 'Failed to delete address'));
    }
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    // State
    addresses,
    isLoading,
    isSaving,
    error,
    // Actions
    load,
    create,
    update,
    remove,
    // Helpers
    clearError,
  };
}
