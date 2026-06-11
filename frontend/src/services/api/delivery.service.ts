// ============================================================
// DELIVERY SERVICE — All delivery-related API calls
// ============================================================
import http from './http.service';
import type { ApiResponse, Delivery, PaginatedResponse } from '../../models';

export interface CreateDeliveryPayload {
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  packageType?: string;
  notes?: string;
  desiredDate?: string;
  clientInfo?: { name: string; phone: string; email?: string };
}

export interface EstimatePayload {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  packageType?: string;
}

const DeliveryService = {
  // Client
  estimate: (payload: EstimatePayload) =>
    http.post<ApiResponse<{ price: number; distance_km: number; eta_minutes: number }>>('/v1/deliveries/estimate', payload),

  create: (payload: CreateDeliveryPayload) =>
    http.post<ApiResponse<Delivery>>('/v1/deliveries', payload),

  getAll: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Delivery>>('/v1/deliveries', { params }),

  getById: (id: string) =>
    http.get<ApiResponse<Delivery>>(`/v1/deliveries/${id}`),

  cancel: (id: string) =>
    http.put<ApiResponse<Delivery>>(`/v1/deliveries/${id}/cancel`),

  // Driver
  getAvailable: () =>
    http.get<ApiResponse<Delivery[]>>('/v1/driver/deliveries/available'),

  getMyDeliveries: () =>
    http.get<ApiResponse<Delivery[]>>('/v1/driver/deliveries/my-deliveries'),

  getCurrent: () =>
    http.get<ApiResponse<Delivery>>('/v1/driver/deliveries/current'),

  accept: (id: string) =>
    http.put<ApiResponse<Delivery>>(`/v1/driver/deliveries/${id}/accept`),

  reject: (id: string, reason?: string) =>
    http.post<ApiResponse<Delivery>>(`/v1/driver/deliveries/${id}/reject`, { reason }),

  updateStatus: (id: string, status: string) =>
    http.put<ApiResponse<Delivery>>(`/v1/driver/deliveries/${id}/status`, { status }),

  updateDriverStatus: (status: string) =>
    http.put('/v1/driver/deliveries/status', { status }),

  updateLocation: (id: string, lat: number, lng: number) =>
    http.put(`/v1/driver/deliveries/${id}/location`, { lat, lng }),

  // Tracking
  trackByCode: (code: string) =>
    http.get<ApiResponse<Delivery>>(`/v1/track/${code}`),

  verifyTrackingCode: (code: string, accessCode: string) =>
    http.post('/v1/track/verify', { code, accessCode }),

  resendTrackingCode: (code: string) =>
    http.post('/v1/track/resend-code', { code }),
};

export default DeliveryService;
