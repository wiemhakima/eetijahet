// Model — accès aux données uniquement. Aucun état, aucune logique métier.
// Le Controller est le seul à appeler ces méthodes.

import api from '../../api';
import type { Developer, EditDeveloperForm, NotifyForm, Pagination } from './types';

export interface DeveloperListResponse {
  success: boolean;
  data: { users: Developer[]; pagination: Pagination };
}

export const DeveloperModel = {
  async fetchAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
  }): Promise<{ users: Developer[]; pagination: Pagination }> {
    const q = new URLSearchParams();
    q.append('page',  String(params.page  ?? 1));
    q.append('limit', String(params.limit ?? 10));
    if (params.search) q.append('search', params.search);
    if (params.tier)   q.append('tier',   params.tier);
    q.append('role', 'developer');
    const res = await api.get<DeveloperListResponse>(`/v1/admin/users?${q}`);
    return res.data.data;
  },

  async update(id: string, form: Partial<EditDeveloperForm>): Promise<Developer> {
    const res = await api.put<{ data: Developer }>(`/v1/admin/users/${id}`, form);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/v1/admin/users/${id}`);
  },

  async notify(userId: string, form: NotifyForm): Promise<void> {
    await api.post(`/v1/admin/notifications/send`, { ...form, userId });
  },

  async impersonate(id: string): Promise<string> {
    const res = await api.post<{ data: { token: string } }>(`/v1/admin/users/${id}/impersonate`);
    return res.data.data.token;
  },
};
