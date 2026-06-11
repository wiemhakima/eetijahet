export interface Developer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  role: 'user' | 'admin' | 'developer';
  createdAt: string;
  activeApiSettings?: {
    totalCredits: number;
    usedCredits: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    concurrentRequests: number;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface EditDeveloperForm {
  firstName: string;
  lastName: string;
  email: string;
  tier: string;
  totalCredits: number;
}

export interface NotifyForm {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
