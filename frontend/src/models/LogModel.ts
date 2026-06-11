// frontend/src/models/LogModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RequestLog {
  _id: string;
  userId: string;
  apiKeyId?: {
    _id: string;
    name: string;
  };
  apiKeyName?: string;
  requestStatus: number;
  responseMessage?: string;
  requestDate: string;
  creditsUsed: number;
  endpointRoute: string;
  endpointName?: string;
  endpointCategory?: string;
  method: string;
  requestBody?: Record<string, unknown>;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
  errorDetails?: string;
  isSuccess: boolean;
}

export interface LogsFilter {
  page?: number;
  limit?: number;
  status?: number;
  success?: boolean;
  endpoint?: string;
  endpointName?: string;
  category?: string;
  apiKeyName?: string;
  apiKeyId?: string;
  startDate?: string;
  endDate?: string;
}

export interface LogsStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgResponseTime: number;
  creditsUsed: number;
  requestsByEndpoint: {
    route: string;
    name: string;
    category: string;
    count: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgResponseTime: number;
  }[];
  requestsByApiKey: {
    apiKeyId: string;
    apiKeyName: string;
    count: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgResponseTime: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface Pagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const LogModel = {
  getAll: (filters: LogsFilter = {}) =>
    api.get('/v1/logs', { params: filters }),

  getOne: (id: string) =>
    api.get(`/v1/logs/${id}`),

  getStats: (dateRange: { startDate?: string; endDate?: string } = {}) =>
    api.get('/v1/logs/stats', { params: dateRange }),
};
