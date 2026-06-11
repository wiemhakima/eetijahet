// frontend/src/controllers/useApiKeyController.ts
import { useState, useEffect, useCallback } from 'react';
import { ApiKeyModel } from '../models/ApiKeyModel';
import type { ApiKey } from '../models/ApiKeyModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useApiKeyController() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  // `newKey` holds the newly created key (full secret), cleared after the user copies it
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    if (e instanceof Error) return e.message;
    return fallback;
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiKeyModel.getAll();
      const raw = res.data.data;
      setApiKeys((Array.isArray(raw) ? raw : (raw?.keys ?? [])) as ApiKey[]);
    } catch (e) {
      setError(extractError(e, 'Failed to fetch API keys'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (data: { name: string; permissions: string[] }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiKeyModel.create(data);
      const created = res.data.data as ApiKey;
      setApiKeys(prev => [...prev, created]);
      setNewKey(created);
      return created;
    } catch (e) {
      setError(extractError(e, 'Failed to create API key'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revoke = useCallback(async (keyId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await ApiKeyModel.revoke(keyId);
      setApiKeys(prev =>
        prev.map(key => (key._id === keyId ? { ...key, status: 'revoked' as const } : key))
      );
    } catch (e) {
      setError(extractError(e, 'Failed to revoke API key'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearNewKey = useCallback(() => setNewKey(null), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    // State
    apiKeys,
    newKey,
    isLoading,
    error,
    // Actions
    load,
    create,
    revoke,
    // Helpers
    clearNewKey,
    clearError,
  };
}
