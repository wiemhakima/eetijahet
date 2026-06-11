// frontend/src/controllers/useUsageController.ts
import { useState, useEffect, useCallback } from 'react';
import { UsageModel } from '../models/UsageModel';
import type { UsageData } from '../models/UsageModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useUsageController() {
  const [data, setData] = useState<UsageData | null>(null);
  const [timeRange, setTimeRangeState] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error;
    return raw ?? (e as { message?: string })?.message ?? fallback;
  };

  const load = useCallback(async (range?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await UsageModel.getData(range ?? timeRange);
      setData(res.data.data as UsageData);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch usage data'));
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  const setTimeRange = useCallback((range: '7days' | '30days' | '90days' | 'custom') => {
    setTimeRangeState(range);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Reload whenever the timeRange changes
  useEffect(() => {
    load(timeRange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  return {
    // State
    data,
    timeRange,
    isLoading,
    error,
    // Actions
    load,
    setTimeRange,
    // Helpers
    clearError,
  };
}
