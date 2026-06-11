import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ratingService } from '../../api/ratingService';
import type { Rating, DriverRatingStats } from '../../api/ratingService';

interface RatingState {
  driverRatings:    Rating[];
  driverStats:      DriverRatingStats;
  ratedDeliveryIds: string[];   // delivery IDs already rated by this client
  isLoading:        boolean;
  isSubmitting:     boolean;
  error:            string | null;
}

const initialState: RatingState = {
  driverRatings:    [],
  driverStats:      { count: 0, average: 0 },
  ratedDeliveryIds: [],
  isLoading:        false,
  isSubmitting:     false,
  error:            null,
};

export const submitRating = createAsyncThunk(
  'ratings/submit',
  async (
    { deliveryId, stars, comment }: { deliveryId: string; stars: number; comment?: string },
    { rejectWithValue }
  ) => {
    try {
      await ratingService.submit(deliveryId, stars, comment);
      return deliveryId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur lors de la notation');
    }
  }
);

export const fetchDriverRatings = createAsyncThunk(
  'ratings/fetchDriver',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const res = await ratingService.getDriverRatings(driverId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur');
    }
  }
);

export const fetchMyRatings = createAsyncThunk(
  'ratings/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await ratingService.getMyRatings();
      const items = (res.data.data as any).ratings ?? res.data.data ?? [];
      return items.map((r: any) => r.delivery);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur');
    }
  }
);

const ratingSlice = createSlice({
  name: 'ratings',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitRating.pending,   (state) => { state.isSubmitting = true;  state.error = null; })
      .addCase(submitRating.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.ratedDeliveryIds.push(action.payload);
      })
      .addCase(submitRating.rejected,  (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      .addCase(fetchDriverRatings.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchDriverRatings.fulfilled, (state, action) => {
        state.isLoading     = false;
        state.driverRatings = action.payload.data;
        state.driverStats   = action.payload.stats;
      })
      .addCase(fetchDriverRatings.rejected, (state) => { state.isLoading = false; })

      .addCase(fetchMyRatings.fulfilled, (state, action) => {
        state.ratedDeliveryIds = action.payload;
      });
  },
});

export const { clearError } = ratingSlice.actions;
export default ratingSlice.reducer;
