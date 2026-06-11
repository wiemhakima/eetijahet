// ============================================================
// AGENCY SERVICE — All agency-related API calls
// ============================================================
import http from './http.service';
import type { Agency, ApiResponse, Delivery, User, Merchant } from '../../models';

const AgencyService = {
  // Agency profile
  getMe: () =>
    http.get<ApiResponse<Agency>>('/v1/agencies/me'),

  update: (data: Partial<Agency>) =>
    http.put<ApiResponse<Agency>>('/v1/agencies/me', data),

  getPublic: () =>
    http.get<ApiResponse<Agency[]>>('/v1/agencies/public'),

  // Drivers
  getDrivers: () =>
    http.get<ApiResponse<User[]>>('/v1/agencies/me/drivers'),

  getAvailableDrivers: () =>
    http.get<ApiResponse<User[]>>('/v1/agencies/me/drivers/available'),

  inviteDriver: (data: { email: string; firstName: string; lastName: string; phone?: string }) =>
    http.post<ApiResponse<User>>('/v1/agencies/me/drivers', data),

  updateDriver: (driverId: string, data: Partial<User>) =>
    http.put<ApiResponse<User>>(`/v1/agencies/me/drivers/${driverId}`, data),

  removeDriver: (driverId: string) =>
    http.delete(`/v1/agencies/me/drivers/${driverId}`),

  // Clients
  getClients: () =>
    http.get<ApiResponse<User[]>>('/v1/agencies/me/clients'),

  inviteClient: (data: { email: string; firstName: string; lastName: string }) =>
    http.post<ApiResponse<User>>('/v1/agencies/me/clients', data),

  createClientWithDelivery: (data: unknown) =>
    http.post('/v1/agencies/me/clients-with-delivery', data),

  // Deliveries
  getDeliveries: (params?: Record<string, unknown>) =>
    http.get<ApiResponse<Delivery[]>>('/v1/agencies/me/deliveries', { params }),

  createDelivery: (data: unknown) =>
    http.post<ApiResponse<Delivery>>('/v1/agencies/me/deliveries', data),

  assignDriver: (deliveryId: string, driverId: string) =>
    http.put<ApiResponse<Delivery>>(`/v1/agencies/me/deliveries/${deliveryId}/assign`, { driverId }),

  // Statistics & Finances
  getStatistics: () =>
    http.get('/v1/agencies/me/statistics'),

  getFinances: () =>
    http.get('/v1/agencies/me/finances'),

  getStats: () =>
    http.get('/v1/agencies/me/stats'),

  // Merchants
  getMerchants: () =>
    http.get<ApiResponse<Merchant[]>>('/v1/agencies/me/merchants'),

  getMerchantsWithStats: () =>
    http.get('/v1/agencies/me/merchants/with-stats'),

  getMerchantById: (id: string) =>
    http.get<ApiResponse<Merchant>>(`/v1/agencies/me/merchants/${id}`),

  createMerchant: (data: unknown) =>
    http.post<ApiResponse<Merchant>>('/v1/agencies/me/merchants', data),

  updateMerchant: (id: string, data: Partial<Merchant>) =>
    http.put<ApiResponse<Merchant>>(`/v1/agencies/me/merchants/${id}`, data),

  deleteMerchant: (id: string) =>
    http.delete(`/v1/agencies/me/merchants/${id}`),

  getMerchantOrders: (merchantId: string) =>
    http.get(`/v1/agencies/me/merchants/${merchantId}/orders`),

  // Settings
  getSettings: () =>
    http.get('/v1/agencies/me/settings'),

  updateProfile: (data: unknown) =>
    http.put('/v1/agencies/me/settings/profile', data),

  getZones: () =>
    http.get('/v1/agencies/me/settings/zones'),

  updateZones: (data: unknown) =>
    http.put('/v1/agencies/me/settings/zones', data),

  updateHours: (data: unknown) =>
    http.put('/v1/agencies/me/settings/hours', data),

  updateNotificationPrefs: (data: unknown) =>
    http.put('/v1/agencies/me/settings/notifications', data),

  // Team
  getTeam: () =>
    http.get('/v1/agencies/me/settings/team'),

  inviteTeamMember: (data: unknown) =>
    http.post('/v1/agencies/me/settings/team', data),

  updateTeamMember: (memberId: string, data: unknown) =>
    http.put(`/v1/agencies/me/settings/team/${memberId}`, data),

  removeTeamMember: (memberId: string) =>
    http.delete(`/v1/agencies/me/settings/team/${memberId}`),
};

export default AgencyService;
