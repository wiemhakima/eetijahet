// Controller — orchestre le Model et expose état + actions à la View.
// Custom hook React : seule façon d'avoir un "Controller" stateful en React.
// Remplace le Redux slice + thunks pour la page AdminUsers.

import { useState, useEffect, useCallback } from 'react';
import { DeveloperModel } from './DeveloperModel';
import type { Developer, EditDeveloperForm, NotifyForm, Pagination } from './types';

type ApiError = { response?: { data?: { error?: string } } };

export function useDeveloperController() {
  const [developers,  setDevelopers]  = useState<Developer[]>([]);
  const [pagination,  setPagination]  = useState<Pagination | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [tierFilter,  setTierFilter]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await DeveloperModel.fetchAll({
        page: currentPage, limit: 10, search, tier: tierFilter,
      });
      setDevelopers(Array.isArray(result.users) ? result.users : []);
      setPagination(result.pagination);
    } catch (err) {
      setError((err as ApiError)?.response?.data?.error ?? 'Failed to load developers');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, tierFilter]);

  useEffect(() => { load(); }, [load]);

  // ── actions ─────────────────────────────────────────────────────────────────
  const editDeveloper = useCallback(async (id: string, form: Partial<EditDeveloperForm>) => {
    await DeveloperModel.update(id, form);
    await load();
  }, [load]);

  const deleteDeveloper = useCallback(async (id: string) => {
    await DeveloperModel.remove(id);
    setDevelopers(prev => prev.filter(d => d._id !== id));
    setPagination(prev => prev ? { ...prev, total: prev.total - 1 } : null);
  }, []);

  const notifyDeveloper = useCallback(async (id: string, form: NotifyForm) => {
    await DeveloperModel.notify(id, form);
  }, []);

  const impersonateDeveloper = useCallback(async (id: string): Promise<string> => {
    return DeveloperModel.impersonate(id);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleTierFilter = useCallback((value: string) => {
    setTierFilter(value);
    setCurrentPage(1);
  }, []);

  return {
    // State (lecture seule pour la View)
    developers,
    pagination,
    isLoading,
    error,
    search,
    tierFilter,
    currentPage,
    totalDevelopers: pagination?.total ?? developers.length,
    // Actions (seule interface de mutation)
    setCurrentPage,
    handleSearch,
    handleTierFilter,
    editDeveloper,
    deleteDeveloper,
    notifyDeveloper,
    impersonateDeveloper,
  };
}
