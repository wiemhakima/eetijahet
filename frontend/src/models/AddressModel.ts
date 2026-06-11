// frontend/src/models/AddressModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavoriteAddress {
  _id: string;
  label: string;
  street?: string;
  city?: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const AddressModel = {
  getAll: () =>
    api.get('/v1/addresses'),

  create: (data: Omit<FavoriteAddress, '_id' | 'createdAt' | 'updatedAt'>) =>
    api.post('/v1/addresses', data),

  update: (id: string, data: Partial<FavoriteAddress>) =>
    api.put(`/v1/addresses/${id}`, data),

  remove: (id: string) =>
    api.delete(`/v1/addresses/${id}`),
};
