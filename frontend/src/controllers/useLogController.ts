// frontend/src/controllers/useLogController.ts
import { useState, useEffect, useCallback } from 'react';
import { LogModel } from '../models/LogModel';
import type { RequestLog, LogsFilter, LogsStats, Pagination } from '../models/LogModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useLogController() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFiltersState] = useState<LogsFilter>({ page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error;
    return raw ?? (e as { message?: string })?.message ?? fallback;
  };

  // ── Load logs ───────────────────────────────────────────────────────────────

  const load = useCallback(async (overrideFilters?: LogsFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = overrideFilters ?? filters;
      const res = await LogModel.getAll(params);
      const raw = res.data.data;
      setLogs((Array.isArray(raw) ? raw : (raw?.logs ?? [])) as RequestLog[]);
      setPagination((raw?.pagination ?? res.data.pagination) as Pagination);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch logs'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // ── Load one ────────────────────────────────────────────────────────────────

  const loadOne = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await LogModel.getOne(id);
      const log = res.data.data as RequestLog;
      setSelectedLog(log);
      return log;
    } catch (e) {
      setError(extractError(e, 'Failed to fetch log details'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load stats ──────────────────────────────────────────────────────────────

  const loadStats = useCallback(async (dateRange: { startDate?: string; endDate?: string } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await LogModel.getStats(dateRange);
      setStats(res.data.data as LogsStats);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch log statistics'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Filters ─────────────────────────────────────────────────────────────────

  const setFilters = useCallback((partial: LogsFilter) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ page: 1, limit: 20 });
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearSelectedLog = useCallback(() => setSelectedLog(null), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    logs,
    selectedLog,
    stats,
    pagination,
    filters,
    isLoading,
    error,
    // Actions
    load,
    loadOne,
    loadStats,
    // Filters
    setFilters,
    clearFilters,
    // Helpers
    clearSelectedLog,
    clearError,
  };
}
