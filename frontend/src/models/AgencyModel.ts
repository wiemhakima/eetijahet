// frontend/src/models/AgencyModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicAgency {
  _id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  priceBase: number;
  coverageZones: string[];
  rating: number;
  ratingCount: number;
  currency: string;
  slug?: string;
}

export interface AgencyInfo {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  status: 'active' | 'suspended' | 'trial';
  trialEndsAt?: string;
  settings: {
    maxDrivers: number;
    maxDeliveries: number;
    apiAccess: boolean;
    apiRequestsLimit: number;
  };
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd?: string;
    billing?: string;
  } | null;
}

export interface AgencyMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AgencyDelivery {
  _id: string;
  armadaId: string;
  code?: string | null;
  status: string;
  customerName?: string | null;
  customerPhone?: string | null;
  destinationCity?: string | null;
  destinationAddress?: string | null;
  productAmount: number;
  deliveryFee: number;
  commissionRate: number;
  commissionAmount: number;
  trackingLink?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  merchant?: { _id: string; storeName: string; logo?: string; commission: number } | null;
  agency: string;
  createdAt: string;
}

export interface AgencyStats {
  driversCount: number;
  clientsCount: number;
  deliveriesTotal: number;
  deliveriesToday: number;
  deliveriesInProgress: number;
  pendingCount: number;
  deliveredCount: number;
  totalCommission: number;
}

export interface AgencyMerchantItem {
  _id: string;
  storeName: string;
  logo?: string;
  commission: number;
}

export interface AgencySubscription {
  _id: string;
  plan: 'basic' | 'medium' | 'pro';
  billing: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  invoices: { amount: number; currency: string; paidAt: string; invoiceUrl?: string }[];
}

export interface TestModeCredentials {
  clientEmail: string;
  clientPassword: string;
  trackingUrl: string;
  loginUrl: string;
  message: string;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const AgencyModel = {
  // Public agencies list
  getPublicAgencies: (zone?: string) =>
    api.get('/v1/agencies/public', zone ? { params: { zone } } : undefined),

  // Agency self (authenticated agency)
  getMe: () =>
    api.get('/v1/agencies/me'),

  getClients: () =>
    api.get('/v1/agencies/me/clients'),

  inviteClient: (data: { firstName: string; lastName?: string; email: string; phone?: string; sendWhatsapp?: boolean }) =>
    api.post('/v1/agencies/me/clients/invite', data),

  createClientWithDelivery: (data: {
    firstName: string; lastName?: string; email: string; phone: string;
    pickupAddress: string; pickupLat?: number; pickupLng?: number;
    dropoffAddress: string; dropoffLat?: number; dropoffLng?: number;
    packageType?: string; estimatedPrice?: number; notes?: string;
    sendWhatsapp?: boolean;
  }) =>
    api.post('/v1/agencies/me/clients-with-delivery', data),

  getDeliveries: (params: { status?: string; page?: number; merchantId?: string } = {}) =>
    api.get('/v1/agencies/me/deliveries', { params }),

  assignDelivery: (deliveryId: string, driverId: string) =>
    api.put(`/v1/agencies/me/deliveries/${deliveryId}/assign`, { driverId }),

  getStats: () =>
    api.get('/v1/agencies/me/stats'),

  getMerchants: () =>
    api.get('/v1/agencies/me/merchants'),

  // Subscription
  getSubscription: () =>
    api.get('/v1/subscriptions/current'),

  upgradeSubscription: (data: { plan: string; billing: string }) =>
    api.post('/v1/subscriptions', data),

  cancelSubscription: () =>
    api.delete('/v1/subscriptions/current'),
};
