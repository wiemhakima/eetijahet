import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientStatus = 'broadcasting' | 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type PackageType  = 'document' | 'small' | 'medium' | 'large' | 'fragile' | 'food';

export interface DriverInfo {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ClientInfo {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AgencyInfo {
  _id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  phone?: string;
}

export interface ClientDelivery {
  _id: string;
  orderId: string;
  trackingCode?: string;
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  pickupAddress?: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffLabel: string;
  dropoffAddress?: string;
  packageType: PackageType;
  notes?: string;
  desiredDate?: string;
  estimatedPrice?: number;
  distance_km?: number;
  eta_minutes?: number;
  clientStatus: ClientStatus;
  lastLat?: number;
  lastLng?: number;
  driver?: DriverInfo | string;
  client?: ClientInfo | string;
  agency?: AgencyInfo | string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryEstimate {
  distance_km: number;
  eta_minutes: number;
  estimatedPrice: number;
  fallback: boolean;
}

interface DeliveryState {
  deliveries: ClientDelivery[];
  selectedDelivery: ClientDelivery | null;
  estimate: DeliveryEstimate | null;
  isLoading: boolean;
  isEstimating: boolean;
  isCreating: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number };
}

const initialState: DeliveryState = {
  deliveries:       [],
  selectedDelivery: null,
  estimate:         null,
  isLoading:        false,
  isEstimating:     false,
  isCreating:       false,
  error:            null,
  pagination:       { total: 0, page: 1, limit: 20 },
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const estimateDelivery = createAsyncThunk(
  'delivery/estimate',
  async (data: { pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number }, { rejectWithValue }) => {
    try {
      const res = await api.post('/v1/deliveries/estimate', data);
      return res.data.data as DeliveryEstimate;
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      return rejectWithValue(typeof raw === 'string' ? raw : 'Estimation failed');
    }
  }
);

export const createDelivery = createAsyncThunk(
  'delivery/create',
  async (data: Partial<ClientDelivery>, { rejectWithValue }) => {
    try {
      const res = await api.post('/v1/deliveries', data);
      return res.data.data as ClientDelivery;
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      return rejectWithValue(typeof raw === 'string' ? raw : 'Failed to create delivery');
    }
  }
);

export const fetchDeliveries = createAsyncThunk(
  'delivery/fetchAll',
  async (params: { status?: string; page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/v1/deliveries', { params });
      return {
        data:       (res.data.data.deliveries ?? []) as ClientDelivery[],
        pagination: res.data.data.pagination as { total: number; page: number; limit: number },
      };
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      return rejectWithValue(typeof raw === 'string' ? raw : 'Failed to fetch deliveries');
    }
  }
);

export const fetchDelivery = createAsyncThunk(
  'delivery/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/v1/deliveries/${id}`);
      return res.data.data as ClientDelivery;
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      return rejectWithValue(typeof raw === 'string' ? raw : 'Failed to fetch delivery');
    }
  }
);

// Client-specific endpoint (returns agency + driver fully populated)
export const fetchClientDelivery = createAsyncThunk(
  'delivery/fetchClientOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/v1/client/deliveries/${id}`);
      return res.data.data as ClientDelivery;
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      return rejectWithValue(typeof raw === 'string' ? raw : 'Failed to fetch delivery');
    }
  }
);

export const cancelDelivery = createAsyncThunk(
  'delivery/cancel',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.put(`/v1/deliveries/${id}/cancel`);
      return res.data.data as ClientDelivery;
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      return rejectWithValue(typeof raw === 'string' ? raw : 'Failed to cancel delivery');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    clearEstimate:  (state) => { state.estimate = null; },
    clearError:     (state) => { state.error = null; },
    clearSelected:  (state) => { state.selectedDelivery = null; },
  },
  extraReducers: (builder) => {
    // estimate
    builder.addCase(estimateDelivery.pending,   (state) => { state.isEstimating = true; state.error = null; });
    builder.addCase(estimateDelivery.fulfilled, (state, action: PayloadAction<DeliveryEstimate>) => {
      state.isEstimating = false;
      state.estimate = action.payload;
    });
    builder.addCase(estimateDelivery.rejected,  (state, action) => {
      state.isEstimating = false;
      state.error = action.payload as string;
    });

    // create
    builder.addCase(createDelivery.pending,   (state) => { state.isCreating = true; state.error = null; });
    builder.addCase(createDelivery.fulfilled, (state, action: PayloadAction<ClientDelivery>) => {
      state.isCreating = false;
      state.deliveries.unshift(action.payload);
    });
    builder.addCase(createDelivery.rejected,  (state, action) => {
      state.isCreating = false;
      state.error = action.payload as string;
    });

    // fetchAll
    builder.addCase(fetchDeliveries.pending,   (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchDeliveries.fulfilled, (state, action) => {
      state.isLoading  = false;
      state.deliveries = action.payload.data;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchDeliveries.rejected,  (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // fetchOne
    builder.addCase(fetchDelivery.pending,   (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchDelivery.fulfilled, (state, action: PayloadAction<ClientDelivery>) => {
      state.isLoading       = false;
      state.selectedDelivery = action.payload;
    });
    builder.addCase(fetchDelivery.rejected,  (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // fetchClientOne (agency-created delivery with full population)
    builder.addCase(fetchClientDelivery.pending,   (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchClientDelivery.fulfilled, (state, action: PayloadAction<ClientDelivery>) => {
      state.isLoading        = false;
      state.selectedDelivery = action.payload;
    });
    builder.addCase(fetchClientDelivery.rejected,  (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // cancel
    builder.addCase(cancelDelivery.fulfilled, (state, action: PayloadAction<ClientDelivery>) => {
      const idx = state.deliveries.findIndex(d => d._id === action.payload._id);
      if (idx !== -1) state.deliveries[idx] = action.payload;
      if (state.selectedDelivery?._id === action.payload._id) {
        state.selectedDelivery = action.payload;
      }
    });
    builder.addCase(cancelDelivery.rejected, (state, action) => {
      state.error = action.payload as string;
    });

  },
});

export const { clearEstimate, clearError, clearSelected } = deliverySlice.actions;
export default deliverySlice.reducer;
