// frontend/src/models/UsageModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyUsage {
  date: string;
  value: number;
}

export interface DailyRequestHistory {
  date: string;
  success: number;
  failed: number;
}

export interface ModelUsage {
  name: string;
  requests: number;
  credits: number;
  avgResponseTime: number;
  successRate: number;
}

export interface UsageLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrentRequests: number;
}

export interface UsageData {
  credits: {
    total: number;
    used: number;
    remaining: number;
    percentUsed: number;
    refreshDate: string;
    history: DailyUsage[];
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    history: DailyRequestHistory[];
  };
  models: ModelUsage[];
  limits: UsageLimits;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const UsageModel = {
  getData: (timeRange: string = '30days') =>
    api.get('/v1/usage', { params: { timeRange } }),
};
