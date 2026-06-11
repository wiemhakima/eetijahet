// frontend/src/models/DeliveryModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientStatus =
  | 'broadcasting'
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type PackageType = 'document' | 'small' | 'medium' | 'large' | 'fragile' | 'food';

export interface DriverInfo {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ClientInfo {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AgencyInfo {
  _id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  phone?: string;
}

export interface ClientDelivery {
  _id: string;
  orderId: string;
  trackingCode?: string;
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  pickupAddress?: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffLabel: string;
  dropoffAddress?: string;
  packageType: PackageType;
  notes?: string;
  desiredDate?: string;
  estimatedPrice?: number;
  distance_km?: number;
  eta_minutes?: number;
  clientStatus: ClientStatus;
  lastLat?: number;
  lastLng?: number;
  driver?: DriverInfo | string;
  client?: ClientInfo | string;
  agency?: AgencyInfo | string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryEstimate {
  distance_km: number;
  eta_minutes: number;
  estimatedPrice: number;
  fallback: boolean;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const DeliveryModel = {
  estimate: (data: { pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number }) =>
    api.post('/v1/deliveries/estimate', data),

  create: (data: Partial<ClientDelivery>) =>
    api.post('/v1/deliveries', data),

  getAll: (params: { status?: string; page?: number; limit?: number } = {}) =>
    api.get('/v1/deliveries', { params }),

  getOne: (id: string) =>
    api.get(`/v1/deliveries/${id}`),

  // Client-specific endpoint — returns agency + driver fully populated
  getClientOne: (id: string) =>
    api.get(`/v1/client/deliveries/${id}`),

  cancel: (id: string) =>
    api.put(`/v1/deliveries/${id}/cancel`),
};
