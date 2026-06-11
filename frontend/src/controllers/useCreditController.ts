// frontend/src/controllers/useCreditController.ts
import { useState, useEffect, useCallback } from 'react';
import { CreditModel } from '../models/CreditModel';
import type {
  CreditsData,
  CreditTransaction,
  PurchaseResult,
  TransactionsPagination,
} from '../models/CreditModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useCreditController() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [transactionsPagination, setTransactionsPagination] = useState<TransactionsPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error;
    return raw ?? (e as { message?: string })?.message ?? fallback;
  };

  // ── Load overview ───────────────────────────────────────────────────────────

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await CreditModel.getOverview();
      setData(res.data.data as CreditsData);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch credits data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Purchase ────────────────────────────────────────────────────────────────

  const purchase = useCallback(async (packageId: string) => {
    setIsPurchasing(true);
    setPurchaseError(null);
    setPurchaseSuccess(false);
    try {
      const res = await CreditModel.purchase(packageId);
      const result = res.data.data as PurchaseResult;
      setPurchaseSuccess(true);

      // Update data in-place so the UI reflects the new balance immediately
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalCredits: result.totalCredits,
          usedCredits: result.usedCredits,
          remainingCredits: result.remainingCredits,
          percentUsed:
            result.totalCredits > 0
              ? parseFloat(((result.usedCredits / result.totalCredits) * 100).toFixed(1))
              : 0,
          transactions: [result.transaction as unknown as CreditTransaction, ...prev.transactions],
        };
      });

      return result;
    } catch (e) {
      setPurchaseError(extractError(e, 'Failed to purchase credits'));
      return null;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // ── Load transactions (paginated) ───────────────────────────────────────────

  const loadTransactions = useCallback(async (params: { page?: number; limit?: number; type?: string } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await CreditModel.getTransactions(params);
      const payload = res.data.data as { transactions: CreditTransaction[]; pagination: TransactionsPagination };
      setTransactionsPagination(payload.pagination);
      setData(prev => (prev ? { ...prev, transactions: payload.transactions } : prev));
    } catch (e) {
      setError(extractError(e, 'Failed to fetch transactions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);
  const clearPurchaseStatus = useCallback(() => {
    setPurchaseError(null);
    setPurchaseSuccess(false);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return {
    // State
    data,
    transactionsPagination,
    isLoading,
    isPurchasing,
    error,
    purchaseError,
    purchaseSuccess,
    // Actions
    loadOverview,
    purchase,
    loadTransactions,
    // Helpers
    clearError,
    clearPurchaseStatus,
  };
}
