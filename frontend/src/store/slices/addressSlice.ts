import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavoriteAddress {
  _id: string;
  label: string;
  street?: string;
  city?: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddressState {
  addresses:  FavoriteAddress[];
  isLoading:  boolean;
  isSaving:   boolean;
  error:      string | null;
}

const initialState: AddressState = {
  addresses:  [],
  isLoading:  false,
  isSaving:   false,
  error:      null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

const errMsg = (err: unknown, fallback: string) => {
  const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
  return typeof raw === 'string' ? raw : fallback;
};

export const fetchAddresses = createAsyncThunk(
  'address/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/v1/addresses');
      return (res.data.data.addresses ?? res.data.data ?? []) as FavoriteAddress[];
    } catch (err) {
      return rejectWithValue(errMsg(err, 'Failed to fetch addresses'));
    }
  }
);

export const createAddress = createAsyncThunk(
  'address/create',
  async (data: Omit<FavoriteAddress, '_id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const res = await api.post('/v1/addresses', data);
      return res.data.data as FavoriteAddress;
    } catch (err) {
      return rejectWithValue(errMsg(err, 'Failed to create address'));
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/update',
  async ({ id, data }: { id: string; data: Partial<FavoriteAddress> }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/v1/addresses/${id}`, data);
      return res.data.data as FavoriteAddress;
    } catch (err) {
      return rejectWithValue(errMsg(err, 'Failed to update address'));
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/v1/addresses/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(errMsg(err, 'Failed to delete address'));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAddresses.pending,   (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchAddresses.fulfilled, (state, action: PayloadAction<FavoriteAddress[]>) => {
      state.isLoading = false;
      state.addresses = action.payload;
    });
    builder.addCase(fetchAddresses.rejected,  (state, action) => {
      state.isLoading = false; state.error = action.payload as string;
    });

    builder.addCase(createAddress.pending,   (state) => { state.isSaving = true; state.error = null; });
    builder.addCase(createAddress.fulfilled, (state, action: PayloadAction<FavoriteAddress>) => {
      state.isSaving = false;
      if (action.payload.isDefault) {
        state.addresses.forEach(a => { a.isDefault = false; });
      }
      state.addresses.unshift(action.payload);
    });
    builder.addCase(createAddress.rejected,  (state, action) => {
      state.isSaving = false; state.error = action.payload as string;
    });

    builder.addCase(updateAddress.pending,   (state) => { state.isSaving = true; state.error = null; });
    builder.addCase(updateAddress.fulfilled, (state, action: PayloadAction<FavoriteAddress>) => {
      state.isSaving = false;
      if (action.payload.isDefault) {
        state.addresses.forEach(a => { a.isDefault = false; });
      }
      const idx = state.addresses.findIndex(a => a._id === action.payload._id);
      if (idx !== -1) state.addresses[idx] = action.payload;
    });
    builder.addCase(updateAddress.rejected,  (state, action) => {
      state.isSaving = false; state.error = action.payload as string;
    });

    builder.addCase(deleteAddress.fulfilled, (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(a => a._id !== action.payload);
    });
    builder.addCase(deleteAddress.rejected,  (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = addressSlice.actions;
export default addressSlice.reducer;
