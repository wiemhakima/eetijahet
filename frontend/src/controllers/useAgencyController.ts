// frontend/src/controllers/useAgencyController.ts
import { useState, useEffect, useCallback } from 'react';
import { AgencyModel } from '../models/AgencyModel';
import type {
  PublicAgency,
  AgencyInfo,
  AgencyMember,
  AgencyDelivery,
  AgencyStats,
  AgencyMerchantItem,
  AgencySubscription,
  TestModeCredentials,
} from '../models/AgencyModel';

// ─── Controller ───────────────────────────────────────────────────────────────

export function useAgencyController() {
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [clients, setClients] = useState<AgencyMember[]>([]);
  const [deliveries, setDeliveries] = useState<AgencyDelivery[]>([]);
  const [deliveriesTotal, setDeliveriesTotal] = useState(0);
  const [subscription, setSubscription] = useState<AgencySubscription | null>(null);
  const [publicAgencies, setPublicAgencies] = useState<PublicAgency[]>([]);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [agencyMerchants, setAgencyMerchants] = useState<AgencyMerchantItem[]>([]);
  // Socket.IO — tracks which merchants are currently online
  const [onlineMerchants, setOnlineMerchants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractError = (e: unknown, fallback: string): string => {
    const raw = (e as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
    if (Array.isArray(raw)) return raw.join(', ');
    if (typeof raw === 'string') return raw;
    return fallback;
  };

  const wrap = useCallback(
    async <T>(fn: () => Promise<T>, fallback: string): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fn();
        return result;
      } catch (e) {
        setError(extractError(e, fallback));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Public agencies ────────────────────────────────────────────────────────

  const loadPublicAgencies = useCallback(async (zone?: string) => {
    await wrap(async () => {
      const res = await AgencyModel.getPublicAgencies(zone);
      const rawP = res.data.data;
      setPublicAgencies((Array.isArray(rawP) ? rawP : (rawP?.data ?? rawP?.agencies ?? [])) as PublicAgency[]);
    }, 'Failed to load agencies');
  }, [wrap]);

  // ── Agency self ────────────────────────────────────────────────────────────

  const loadAgency = useCallback(async () => {
    await wrap(async () => {
      const res = await AgencyModel.getMe();
      setAgency(res.data.data as AgencyInfo);
    }, 'Failed to load agency');
  }, [wrap]);

  const loadClients = useCallback(async () => {
    await wrap(async () => {
      const res = await AgencyModel.getClients();
      const rawC = res.data.data;
      setClients((Array.isArray(rawC) ? rawC : (rawC?.data ?? rawC?.clients ?? [])) as AgencyMember[]);
    }, 'Failed to load clients');
  }, [wrap]);

  const inviteClient = useCallback(async (data: {
    firstName: string; lastName?: string; email: string; phone?: string; sendWhatsapp?: boolean;
  }) => {
    return wrap(async () => {
      const res = await AgencyModel.inviteClient(data);
      const created = res.data.data as AgencyMember;
      setClients(prev => [created, ...prev]);
      return created;
    }, 'Failed to invite client');
  }, [wrap]);

  const createClientWithDelivery = useCallback(async (data: {
    firstName: string; lastName?: string; email: string; phone: string;
    pickupAddress: string; pickupLat?: number; pickupLng?: number;
    dropoffAddress: string; dropoffLat?: number; dropoffLng?: number;
    packageType?: string; estimatedPrice?: number; notes?: string;
    sendWhatsapp?: boolean;
  }) => {
    return wrap(async () => {
      const res = await AgencyModel.createClientWithDelivery(data);
      return res.data as {
        data: { client: { id: string; firstName: string; email: string; isNewClient: boolean }; delivery: { id: string; orderId: string; trackingCode: string; trackingUrl: string } };
        testMode: TestModeCredentials | null;
        driversNotified: number;
        message: string;
      };
    }, 'Failed to create client & delivery');
  }, [wrap]);

  // ── Deliveries ─────────────────────────────────────────────────────────────

  const loadDeliveries = useCallback(async (params: { status?: string; page?: number; merchantId?: string } = {}) => {
    await wrap(async () => {
      const res = await AgencyModel.getDeliveries(params);
      const rawD = res.data.data;
      setDeliveries((Array.isArray(rawD) ? rawD : (rawD?.data ?? [])) as AgencyDelivery[]);
      setDeliveriesTotal(rawD?.total ?? res.data.total ?? 0);
    }, 'Failed to load deliveries');
  }, [wrap]);

  const assignDelivery = useCallback(async (deliveryId: string, driverId: string) => {
    return wrap(async () => {
      const res = await AgencyModel.assignDelivery(deliveryId, driverId);
      const updated = res.data.data as AgencyDelivery;
      setDeliveries(prev => prev.map(d => (d._id === updated._id ? updated : d)));
      return updated;
    }, 'Failed to assign driver');
  }, [wrap]);

  // ── Stats & merchants ──────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    await wrap(async () => {
      const res = await AgencyModel.getStats();
      setStats(res.data.data as AgencyStats);
    }, 'Failed to load stats');
  }, [wrap]);

  const loadMerchants = useCallback(async () => {
    await wrap(async () => {
      const res = await AgencyModel.getMerchants();
      const rawM = res.data.data;
      setAgencyMerchants((Array.isArray(rawM) ? rawM : (rawM?.merchants ?? rawM?.data ?? [])) as AgencyMerchantItem[]);
    }, 'Failed to load merchants');
  }, [wrap]);

  // ── Subscription ───────────────────────────────────────────────────────────

  const loadSubscription = useCallback(async () => {
    await wrap(async () => {
      const res = await AgencyModel.getSubscription();
      setSubscription(res.data.data.subscription as AgencySubscription);
    }, 'Failed to load subscription');
  }, [wrap]);

  const upgradeSubscription = useCallback(async (data: { plan: string; billing: string }) => {
    return wrap(async () => {
      const res = await AgencyModel.upgradeSubscription(data);
      const updated = res.data.data as AgencySubscription;
      setSubscription(updated);
      return updated;
    }, 'Failed to upgrade subscription');
  }, [wrap]);

  const cancelSubscription = useCallback(async () => {
    await wrap(async () => {
      await AgencyModel.cancelSubscription();
      setSubscription(null);
    }, 'Failed to cancel subscription');
  }, [wrap]);

  // ── Socket.IO helpers ──────────────────────────────────────────────────────
  // Call these from your socket event handlers:
  // socket.on('merchant:online',  ({ merchantId }) => setMerchantOnline(merchantId, true))
  // socket.on('merchant:offline', ({ merchantId }) => setMerchantOnline(merchantId, false))
  // socket.on('merchants:snapshot', (ids) => setMerchantsSnapshot(ids))

  const setMerchantOnline = useCallback((merchantId: string, online: boolean) => {
    setOnlineMerchants(prev =>
      online
        ? prev.includes(merchantId) ? prev : [...prev, merchantId]
        : prev.filter(id => id !== merchantId)
    );
  }, []);

  const setMerchantsSnapshot = useCallback((ids: string[]) => {
    setOnlineMerchants(ids);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    loadAgency();
  }, [loadAgency]);

  return {
    // State
    agency,
    clients,
    deliveries,
    deliveriesTotal,
    subscription,
    publicAgencies,
    stats,
    agencyMerchants,
    onlineMerchants,
    isLoading,
    error,
    // Actions
    loadPublicAgencies,
    loadAgency,
    loadClients,
    inviteClient,
    createClientWithDelivery,
    loadDeliveries,
    assignDelivery,
    loadStats,
    loadMerchants,
    loadSubscription,
    upgradeSubscription,
    cancelSubscription,
    // Socket.IO helpers
    setMerchantOnline,
    setMerchantsSnapshot,
    // Helpers
    clearError,
  };
}
