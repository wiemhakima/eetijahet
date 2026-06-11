// Credits module data types and mock data

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

export const mockCreditsData: CreditsData = {
  totalCredits: 10000,
  usedCredits: 7550,
  remainingCredits: 2450,
  costPerRequest: 1,
  percentUsed: 75.5,
  packages: [
    {
      id: 'pkg_starter',
      name: 'Starter',
      credits: 1000,
      price: 9.99,
      pricePerCredit: 0.00999,
      popular: false,
      savings: '',
    },
    {
      id: 'pkg_growth',
      name: 'Growth',
      credits: 5000,
      price: 39.99,
      pricePerCredit: 0.008,
      popular: true,
      savings: '20% off',
    },
    {
      id: 'pkg_pro',
      name: 'Professional',
      credits: 25000,
      price: 149.99,
      pricePerCredit: 0.006,
      popular: false,
      savings: '40% off',
    },
    {
      id: 'pkg_enterprise',
      name: 'Enterprise',
      credits: 100000,
      price: 449.99,
      pricePerCredit: 0.0045,
      popular: false,
      savings: '55% off',
    },
  ],
  services: [
    {
      name: 'ETA Prediction',
      endpoint: '/v1/predict/eta',
      creditsPerRequest: 1,
      totalRequests: 4250,
      totalCreditsUsed: 4250,
      color: '#1a73e8',
    },
    {
      name: 'Distance Estimation',
      endpoint: '/v1/predict/distance',
      creditsPerRequest: 1,
      totalRequests: 1820,
      totalCreditsUsed: 1820,
      color: '#4285f4',
    },
    {
      name: 'Combined Model',
      endpoint: '/v1/predict/combined',
      creditsPerRequest: 2,
      totalRequests: 430,
      totalCreditsUsed: 860,
      color: '#34a853',
    },
    {
      name: 'Routing Engine',
      endpoint: '/v1/route',
      creditsPerRequest: 2,
      totalRequests: 50,
      totalCreditsUsed: 100,
      color: '#ea4335',
    },
  ],
  transactions: [
    {
      id: 'txn_001',
      type: 'purchase',
      description: 'Growth Package — 5,000 credits',
      credits: 5000,
      date: 'Feb 8, 2026',
      balance: 7450,
    },
    {
      id: 'txn_002',
      type: 'deduction',
      description: 'API Usage — 342 requests',
      credits: -342,
      date: 'Feb 7, 2026',
      balance: 2450,
    },
    {
      id: 'txn_003',
      type: 'deduction',
      description: 'API Usage — 518 requests',
      credits: -518,
      date: 'Feb 6, 2026',
      balance: 2792,
    },
    {
      id: 'txn_004',
      type: 'bonus',
      description: 'Welcome Bonus',
      credits: 500,
      date: 'Feb 1, 2026',
      balance: 3310,
    },
    {
      id: 'txn_005',
      type: 'purchase',
      description: 'Starter Package — 1,000 credits',
      credits: 1000,
      date: 'Jan 25, 2026',
      balance: 2810,
    },
    {
      id: 'txn_006',
      type: 'deduction',
      description: 'API Usage — 690 requests',
      credits: -690,
      date: 'Jan 24, 2026',
      balance: 1810,
    },
    {
      id: 'txn_007',
      type: 'purchase',
      description: 'Professional Package — 25,000 credits',
      credits: 25000,
      date: 'Jan 15, 2026',
      balance: 2500,
    },
  ],
  alerts: [
    {
      id: 'alert_low',
      title: 'Low credit warning',
      description: 'Get notified when credits fall below threshold',
      enabled: true,
      threshold: 500,
    },
    {
      id: 'alert_empty',
      title: 'Credits depleted alert',
      description: 'Get notified immediately when credits run out',
      enabled: true,
    },
    {
      id: 'alert_purchase',
      title: 'Auto-purchase on low balance',
      description: 'Automatically buy credits when balance is low',
      enabled: false,
    },
  ],
  usageHistory: [
    { date: 'Feb 1', credits: 412 },
    { date: 'Feb 2', credits: 385 },
    { date: 'Feb 3', credits: 523 },
    { date: 'Feb 4', credits: 287 },
    { date: 'Feb 5', credits: 656 },
    { date: 'Feb 6', credits: 518 },
    { date: 'Feb 7', credits: 342 },
    { date: 'Feb 8', credits: 478 },
    { date: 'Feb 9', credits: 612 },
    { date: 'Feb 10', credits: 337 },
  ],
};
