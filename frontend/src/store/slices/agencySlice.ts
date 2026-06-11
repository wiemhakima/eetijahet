import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PublicAgency {
  _id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  priceBase: number;
  coverageZones: string[];
  rating: number;
  ratingCount: number;
  currency: string;
  slug?: string;
}

export interface AgencyInfo {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  status: 'active' | 'suspended' | 'trial';
  trialEndsAt?: string;
  settings: {
    maxDrivers: number;
    maxDeliveries: number;
    apiAccess: boolean;
    apiRequestsLimit: number;
  };
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd?: string;
    billing?: string;
  } | null;
}

export interface AgencyMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AgencyDelivery {
  _id: string;
  armadaId: string;
  code?: string | null;
  status: string;
  customerName?: string | null;
  customerPhone?: string | null;
  destinationCity?: string | null;
  destinationAddress?: string | null;
  productAmount: number;
  deliveryFee: number;
  commissionRate: number;
  commissionAmount: number;
  trackingLink?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  merchant?: { _id: string; storeName: string; logo?: string; commission: number } | null;
  agency: string;
  createdAt: string;
}

export interface AgencyStats {
  driversCount: number;
  clientsCount: number;
  deliveriesTotal: number;
  deliveriesToday: number;
  deliveriesInProgress: number;
  pendingCount: number;
  deliveredCount: number;
  totalCommission: number;
}

export interface AgencyMerchantItem {
  _id: string;
  storeName: string;
  logo?: string;
  commission: number;
}

export interface AgencySubscription {
  _id: string;
  plan: 'basic' | 'medium' | 'pro';
  billing: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  invoices: { amount: number; currency: string; paidAt: string; invoiceUrl?: string }[];
}

interface AgencyState {
  agency: AgencyInfo | null;
  clients: AgencyMember[];
  deliveries: AgencyDelivery[];
  deliveriesTotal: number;
  subscription: AgencySubscription | null;
  publicAgencies: PublicAgency[];
  stats: AgencyStats | null;
  agencyMerchants: AgencyMerchantItem[];
  onlineMerchants: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AgencyState = {
  agency: null,
  clients: [],
  deliveries: [],
  deliveriesTotal: 0,
  subscription: null,
  publicAgencies: [],
  stats: null,
  agencyMerchants: [],
  onlineMerchants: [],
  isLoading: false,
  error: null,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const extractError = (error: unknown, fallback: string) => {
  const raw = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
  return Array.isArray(raw) ? raw.join(', ') : typeof raw === 'string' ? raw : fallback;
};

// ── Thunks ───────────────────────────────────────────────────────────────────

export const fetchPublicAgencies = createAsyncThunk(
  'agency/fetchPublicAgencies',
  async (zone?: string, { rejectWithValue }) => {
    try {
      const url = zone ? `/v1/agencies/public?zone=${encodeURIComponent(zone)}` : '/v1/agencies/public';
      const res = await api.get(url);
      return (res.data.data.data ?? res.data.data ?? []) as PublicAgency[];
    } catch (e) { return rejectWithValue(extractError(e, 'Failed to load agencies')); }
  }
);

export const fetchAgency = createAsyncThunk('agency/fetchAgency', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/v1/agencies/me');
    return res.data.data as AgencyInfo;
  } catch (e) { return rejectWithValue(extractError(e, 'Failed to load agency')); }
});

export const fetchClients = createAsyncThunk('agency/fetchClients', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/v1/agencies/me/clients');
    return (res.data.data.data ?? res.data.data ?? []) as AgencyMember[];
  } catch (e) { return rejectWithValue(extractError(e, 'Failed to load clients')); }
});

export const inviteClient = createAsyncThunk(
  'agency/inviteClient',
  async (data: { firstName: string; lastName?: string; email: string; phone?: string; sendWhatsapp?: boolean }, { rejectWithValue }) => {
    try {
      const res = await api.post('/v1/agencies/me/clients/invite', data);
      return res.data.data as AgencyMember;
    } catch (e) { return rejectWithValue(extractError(e, 'Failed to invite client')); }
  }
);

export interface TestModeCredentials {
  clientEmail: string;
  clientPassword: string;
  trackingUrl: string;
  loginUrl: string;
  message: string;
}

export const createClientWithDelivery = createAsyncThunk(
  'agency/createClientWithDelivery',
  async (data: {
    firstName: string; lastName?: string; email: string; phone: string;
    pickupAddress: string; pickupLat?: number; pickupLng?: number;
    dropoffAddress: string; dropoffLat?: number; dropoffLng?: number;
    packageType?: string; estimatedPrice?: number; notes?: string;
    sendWhatsapp?: boolean;
  }, { rejectWithValue }) => {
    try {
      const res = await api.post('/v1/agencies/me/clients-with-delivery', data);
      return res.data as {
        data: {
          client:   { id: string; firstName: string; email: string; isNewClient: boolean };
          delivery: { id: string; orderId: string; trackingCode: string; trackingUrl: string };
        };
        testMode: TestModeCredentials | null;
        driversNotified: number;
        message: string;
      };
    } catch (e) { return rejectWithValue(extractError(e, 'Failed to create client & delivery')); }
  }
);

export const fetchDeliveries = createAsyncThunk(
  'agency/fetchDeliveries',
  async (params: { status?: string; page?: number; merchantId?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status)     query.set('status',     params.status);
      if (params.page)       query.set('page',       String(params.page));
      if (params.merchantId) query.set('merchantId', params.merchantId);
      const res = await api.get(`/v1/agencies/me/deliveries?${query.toString()}`);
      return { data: (res.data.data.data ?? []) as AgencyDelivery[], total: (res.data.data.total ?? 0) as number };
    } catch (e) { return rejectWithValue(extractError(e, 'Failed to load deliveries')); }
  }
);

export const fetchAgencyStats = createAsyncThunk('agency/fetchAgencyStats', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/v1/agencies/me/stats');
    return res.data.data as AgencyStats;
  } catch (e) { return rejectWithValue(extractError(e, 'Failed to load stats')); }
});

export const fetchAgencyMerchants = createAsyncThunk('agency/fetchAgencyMerchants', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/v1/agencies/me/merchants');
    return (res.data.data.data ?? res.data.data ?? []) as AgencyMerchantItem[];
  } catch (e) { return rejectWithValue(extractError(e, 'Failed to load merchants')); }
});

export const assignDelivery = createAsyncThunk(
  'agency/assignDelivery',
  async (data: { deliveryId: string; driverId: string }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/v1/agencies/me/deliveries/${data.deliveryId}/assign`, { driverId: data.driverId });
      return res.data.data as AgencyDelivery;
    } catch (e) { return rejectWithValue(extractError(e, 'Failed to assign driver')); }
  }
);

export const fetchSubscription = createAsyncThunk('agency/fetchSubscription', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/v1/subscriptions/current');
    return res.data.data.subscription as AgencySubscription;
  } catch (e) { return rejectWithValue(extractError(e, 'Failed to load subscription')); }
});

export const upgradeSubscription = createAsyncThunk(
  'agency/upgradeSubscription',
  async (data: { plan: string; billing: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/v1/subscriptions', data);
      return res.data.data as AgencySubscription;
    } catch (e) { return rejectWithValue(extractError(e, 'Failed to upgrade subscription')); }
  }
);

export const cancelSubscription = createAsyncThunk(
  'agency/cancelSubscription',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/v1/subscriptions/current');
    } catch (e) { return rejectWithValue(extractError(e, 'Failed to cancel subscription')); }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {
    clearAgencyError: (state) => { state.error = null; },
    setMerchantOnline: (state, action: PayloadAction<{ merchantId: string; online: boolean }>) => {
      const { merchantId, online } = action.payload;
      if (online) {
        if (!state.onlineMerchants.includes(merchantId)) state.onlineMerchants.push(merchantId);
      } else {
        state.onlineMerchants = state.onlineMerchants.filter(id => id !== merchantId);
      }
    },
    setMerchantsSnapshot: (state, action: PayloadAction<string[]>) => {
      state.onlineMerchants = action.payload;
    },
  },
  extraReducers: (builder) => {
    const loading = (state: AgencyState) => { state.isLoading = true; state.error = null; };
    const failed  = (state: AgencyState, action: PayloadAction<unknown>) => {
      state.isLoading = false;
      state.error = action.payload as string;
    };

    builder
      .addCase(fetchAgency.pending, loading)
      .addCase(fetchAgency.fulfilled, (state, a) => { state.isLoading = false; state.agency = a.payload; })
      .addCase(fetchAgency.rejected, failed)

      .addCase(fetchClients.pending, loading)
      .addCase(fetchClients.fulfilled, (state, a) => { state.isLoading = false; state.clients = a.payload; })
      .addCase(fetchClients.rejected, failed)

      .addCase(inviteClient.pending, loading)
      .addCase(inviteClient.fulfilled, (state, a) => { state.isLoading = false; state.clients.unshift(a.payload); })
      .addCase(inviteClient.rejected, failed)

      .addCase(fetchDeliveries.pending, loading)
      .addCase(fetchDeliveries.fulfilled, (state, a) => {
        state.isLoading = false;
        state.deliveries = a.payload.data;
        state.deliveriesTotal = a.payload.total;
      })
      .addCase(fetchDeliveries.rejected, failed)

      .addCase(assignDelivery.pending, loading)
      .addCase(assignDelivery.fulfilled, (state, a) => {
        state.isLoading = false;
        const idx = state.deliveries.findIndex(d => d._id === a.payload._id);
        if (idx !== -1) state.deliveries[idx] = a.payload;
      })
      .addCase(assignDelivery.rejected, failed)

      .addCase(fetchSubscription.pending, loading)
      .addCase(fetchSubscription.fulfilled, (state, a) => { state.isLoading = false; state.subscription = a.payload; })
      .addCase(fetchSubscription.rejected, failed)

      .addCase(upgradeSubscription.pending, loading)
      .addCase(upgradeSubscription.fulfilled, (state, a) => { state.isLoading = false; state.subscription = a.payload; })
      .addCase(upgradeSubscription.rejected, failed)

      .addCase(fetchPublicAgencies.pending, loading)
      .addCase(fetchPublicAgencies.fulfilled, (state, a) => { state.isLoading = false; state.publicAgencies = a.payload; })
      .addCase(fetchPublicAgencies.rejected, failed)

      .addCase(fetchAgencyStats.pending, loading)
      .addCase(fetchAgencyStats.fulfilled, (state, a) => { state.isLoading = false; state.stats = a.payload; })
      .addCase(fetchAgencyStats.rejected, failed)

      .addCase(fetchAgencyMerchants.pending, loading)
      .addCase(fetchAgencyMerchants.fulfilled, (state, a) => { state.isLoading = false; state.agencyMerchants = a.payload; })
      .addCase(fetchAgencyMerchants.rejected, failed);
  },
});

export const { clearAgencyError, setMerchantOnline, setMerchantsSnapshot } = agencySlice.actions;
export default agencySlice.reducer;
