// frontend/src/controllers/useRatingController.ts
import { useState, useCallback } from 'react';
import { RatingModel } from '../models/RatingModel';
import type { Rating, DriverRatingStats } from '../models/RatingModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useRatingController() {
  const [driverRatings, setDriverRatings] = useState<Rating[]>([]);
  const [driverStats, setDriverStats] = useState<DriverRatingStats>({ count: 0, average: 0 });
  // IDs of deliveries this client has already rated
  const [ratedDeliveryIds, setRatedDeliveryIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return raw ?? fallback;
  };

  // ── Submit rating ───────────────────────────────────────────────────────────

  const submit = useCallback(async (deliveryId: string, stars: number, comment?: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await RatingModel.submit(deliveryId, stars, comment);
      setRatedDeliveryIds(prev => [...prev, deliveryId]);
      return true;
    } catch (e) {
      setError(extractError(e, 'Erreur lors de la notation'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ── Driver ratings ──────────────────────────────────────────────────────────

  const loadDriverRatings = useCallback(async (driverId: string) => {
    setIsLoading(true);
    try {
      const res = await RatingModel.getDriverRatings(driverId);
      const payload = res.data as { data: Rating[]; stats: DriverRatingStats };
      setDriverRatings(payload.data);
      setDriverStats(payload.stats);
    } catch {
      // Silently ignore load errors (non-critical UI)
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Order rating ────────────────────────────────────────────────────────────

  const loadOrderRating = useCallback(async (deliveryId: string) => {
    try {
      const res = await RatingModel.getOrderRating(deliveryId);
      return res.data.data as Rating | null;
    } catch {
      return null;
    }
  }, []);

  // ── My ratings (pre-load already-rated deliveries for the current client) ──

  const loadMyRatings = useCallback(async () => {
    try {
      const res = await RatingModel.getMyRatings();
      const ids = (res.data.data as { _id: string; delivery: string; stars: number }[]).map(r => r.delivery);
      setRatedDeliveryIds(ids);
    } catch {
      // Silently ignore
    }
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  return {
    // State
    driverRatings,
    driverStats,
    ratedDeliveryIds,
    isLoading,
    isSubmitting,
    error,
    // Actions
    submit,
    loadDriverRatings,
    loadOrderRating,
    loadMyRatings,
    // Helpers
    clearError,
  };
}
