// ============================================================
// MODELS — Domain types & interfaces (source of truth)
// ============================================================

// ─── User & Auth ────────────────────────────────────────────
export type UserRole =
  | 'user'
  | 'admin'
  | 'driver'
  | 'developer'
  | 'agency_admin'
  | 'super_admin'
  | 'merchant';

export type UserTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type DriverStatus = 'available' | 'busy' | 'offline';

export interface UserPermissions {
  merchants?: boolean;
  drivers?: boolean;
  deliveries?: boolean;
  statistics?: boolean;
  finances?: boolean;
  settings?: boolean;
  team?: boolean;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  agency?: string;
  tier: UserTier;
  driverStatus?: DriverStatus;
  agreeMarketing: boolean;
  maximumRequests: number;
  teamRole?: 'admin' | 'manager';
  permissions?: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean;
}

// ─── Delivery ───────────────────────────────────────────────
export type DeliveryStatus =
  | 'going_to_pickup'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'failed';

export type ClientDeliveryStatus =
  | 'broadcasting'
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type PackageType =
  | 'document'
  | 'small'
  | 'medium'
  | 'large'
  | 'fragile'
  | 'food';

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface ClientInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface Delivery {
  _id: string;
  trackingCode: string;
  orderId?: string;
  status: DeliveryStatus;
  clientStatus: ClientDeliveryStatus;
  agency: string;
  client?: string | User;
  driver?: string | User;
  merchant?: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupLabel?: string;
  dropoffLabel?: string;
  packageType?: PackageType;
  notes?: string;
  desiredDate?: string;
  estimatedPrice?: number;
  distance_km?: number;
  eta_minutes?: number;
  lastLat?: number;
  lastLng?: number;
  eta_predicted_seconds?: number;
  actual_time_seconds?: number;
  gps_trace?: GpsPoint[];
  clientInfo?: ClientInfo;
  productPrice?: number;
  merchantCommission?: number;
  deliveryPrice?: number;
  broadcastedAt?: string;
  broadcastExpiresAt?: string;
  rejectedBy?: string[];
  clientAccessCode?: string;
  codeExpiresAt?: string;
  armadaOrderId?: string;
  armadaStatus?: string;
  armadaTrackingUrl?: string;
  completed_at?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Agency ─────────────────────────────────────────────────
export type AgencyStatus = 'active' | 'suspended' | 'trial';

export interface AgencyProfile {
  name?: string;
  logo?: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    governorate?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface DeliveryZone {
  name: string;
  governorate: string;
  isActive: boolean;
  pricing: {
    basePrice: number;
    pricePerKm: number;
    minimumFee: number;
    expressFee: number;
  };
}

export interface WorkingHours {
  is24_7: boolean;
  schedule: Record<string, {
    isOpen: boolean;
    open: string;
    close: string;
    breakStart?: string;
    breakEnd?: string;
  }>;
  holidays?: string[];
}

export interface TeamMember {
  user: string | User;
  role: string;
  permissions?: UserPermissions;
}

export interface Agency {
  _id: string;
  name: string;
  nameAr?: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  currency: string;
  priceBase: number;
  coverageZones?: string[];
  rating?: number;
  ratingCount?: number;
  owner: string | User;
  subscription?: string | Subscription;
  status: AgencyStatus;
  trialEndsAt?: string;
  settings?: {
    maxDrivers: number;
    maxDeliveries: number;
    apiAccess: boolean;
    apiRequestsLimit: number;
  };
  usage?: {
    deliveriesThisMonth: number;
    lastResetDate: string;
  };
  profile?: AgencyProfile;
  deliveryZones?: DeliveryZone[];
  defaultPricing?: {
    basePrice: number;
    pricePerKm: number;
    minimumFee: number;
    expressFee: number;
  };
  workingHours?: WorkingHours;
  team?: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

// ─── Subscription & Plans ────────────────────────────────────
export type PlanType = 'basic' | 'medium' | 'pro';
export type BillingType = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface Invoice {
  amount: number;
  currency: string;
  paidAt: string;
  invoiceUrl?: string;
  stripeInvoiceId?: string;
}

export interface Subscription {
  _id: string;
  agency: string;
  plan: PlanType;
  billing: BillingType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  invoices?: Invoice[];
  createdAt: string;
  updatedAt: string;
}

// ─── API Keys ────────────────────────────────────────────────
export type ApiKeyStatus = 'active' | 'expired' | 'revoked';
export type ApiPermission =
  | 'time_estimation'
  | 'distance_estimation'
  | 'combined_model'
  | 'route_prediction';

export interface ApiKey {
  _id: string;
  name: string;
  key: string;
  userId: string;
  agency?: string;
  status: ApiKeyStatus;
  permissions: ApiPermission[];
  expires?: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Merchant ────────────────────────────────────────────────
export interface Merchant {
  _id: string;
  storeName: string;
  user: string | User;
  agency: string | Agency;
  commission: number;
  address?: {
    street?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  stats?: {
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
  };
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ────────────────────────────────────────────
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  user?: string;
  global: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Rating ─────────────────────────────────────────────────
export interface Rating {
  _id: string;
  delivery: string | Delivery;
  client: string | User;
  driver: string | User;
  stars: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Address ─────────────────────────────────────────────────
export interface Address {
  _id: string;
  user: string;
  label: string;
  street?: string;
  city?: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Credits & Logs ──────────────────────────────────────────
export type CreditTransactionType = 'purchase' | 'deduction' | 'bonus' | 'refund';

export interface CreditTransaction {
  _id: string;
  userId: string;
  type: CreditTransactionType;
  credits: number;
  balance: number;
  description?: string;
  packageId?: string;
  packageName?: string;
  amountPaid?: number;
  requestCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestLog {
  _id: string;
  userId: string;
  apiKeyId?: string;
  apiKey?: string;
  apiKeyName?: string;
  requestStatus: number;
  responseMessage?: string;
  requestDate: string;
  creditsUsed?: number;
  endpointRoute?: string;
  endpointName?: string;
  endpointCategory?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requestBody?: unknown;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
  errorDetails?: string;
  isSuccess: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response wrapper ────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  token?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
