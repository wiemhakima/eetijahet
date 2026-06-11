// frontend/src/models/ApiKeyModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKey {
  _id: string;
  name: string;
  key: string;
  prefix: string;
  lastUsed?: string;
  created: string;
  expires?: string;
  permissions: string[];
  status: 'active' | 'expired' | 'revoked';
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const ApiKeyModel = {
  getAll: () =>
    api.get('/v1/api-keys'),

  create: (data: { name: string; permissions: string[] }) =>
    api.post('/v1/api-keys', data),

  revoke: (keyId: string) =>
    api.put(`/v1/api-keys/${keyId}/revoke`),
};
