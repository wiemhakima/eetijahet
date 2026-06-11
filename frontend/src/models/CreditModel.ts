// frontend/src/models/CreditModel.ts
import api from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular: boolean;
  savings: string;
}

export interface ServiceCost {
  name: string;
  endpoint: string;
  creditsPerRequest: number;
  totalRequests: number;
  totalCreditsUsed: number;
  color: string;
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'deduction' | 'bonus' | 'refund';
  description: string;
  credits: number;
  date: string;
  balance: number;
}

export interface CreditAlert {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  threshold?: number;
}

export interface CreditsData {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  costPerRequest: number;
  percentUsed: number;
  packages: CreditPackage[];
  services: ServiceCost[];
  transactions: CreditTransaction[];
  alerts: CreditAlert[];
  usageHistory: { date: string; credits: number }[];
}

export interface PurchaseResult {
  transaction: CreditTransaction;
  newBalance: number;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
}

export interface TransactionsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const CreditModel = {
  getOverview: () =>
    api.get('/v1/credits'),

  purchase: (packageId: string) =>
    api.post('/v1/credits/purchase', { packageId }),

  getTransactions: (params: { page?: number; limit?: number; type?: string } = {}) =>
    api.get('/v1/credits/transactions', { params }),
};
