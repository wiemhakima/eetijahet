import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import {
  CreditsData,
  CreditTransaction,
} from '../../pages/Billing/components/billingData';

// Response types for purchase
interface PurchaseResult {
  transaction: CreditTransaction;
  newBalance: number;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
}

interface TransactionsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface TransactionsResponse {
  transactions: CreditTransaction[];
  pagination: TransactionsPagination;
}

interface CreditsState {
  data: CreditsData | null;
  isLoading: boolean;
  error: string | null;
  isPurchasing: boolean;
  purchaseError: string | null;
  purchaseSuccess: boolean;
  transactionsPagination: TransactionsPagination | null;
}

// Initial state
const initialState: CreditsState = {
  data: null,
  isLoading: false,
  error: null,
  isPurchasing: false,
  purchaseError: null,
  purchaseSuccess: false,
  transactionsPagination: null,
};

// Define error type
interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

// Async thunks

/**
 * Fetch complete credits overview
 */
export const fetchCreditsOverview = createAsyncThunk(
  'credits/fetchCreditsOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/v1/credits');
      return response.data.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      return rejectWithValue(
        err.response?.data?.error || err.message || 'Failed to fetch credits data'
      );
    }
  }
);

/**
 * Purchase a credit package
 */
export const purchaseCredits = createAsyncThunk(
  'credits/purchaseCredits',
  async (packageId: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/v1/credits/purchase', { packageId });
      return response.data.data.data as PurchaseResult;
    } catch (error: unknown) {
      const err = error as ApiError;
      return rejectWithValue(
        err.response?.data?.error || err.message || 'Failed to purchase credits'
      );
    }
  }
);

/**
 * Fetch paginated transactions
 */
export const fetchTransactions = createAsyncThunk(
  'credits/fetchTransactions',
  async (
    params: { page?: number; limit?: number; type?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.type) queryParams.set('type', params.type);

      const response = await api.get(`/v1/credits/transactions?${queryParams.toString()}`);
      return response.data.data.data as TransactionsResponse;
    } catch (error: unknown) {
      const err = error as ApiError;
      return rejectWithValue(
        err.response?.data?.error || err.message || 'Failed to fetch transactions'
      );
    }
  }
);

// Credits slice
const creditsSlice = createSlice({
  name: 'credits',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPurchaseStatus: (state) => {
      state.purchaseError = null;
      state.purchaseSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch credits overview
    builder.addCase(fetchCreditsOverview.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      fetchCreditsOverview.fulfilled,
      (state, action: PayloadAction<CreditsData>) => {
        state.isLoading = false;
        state.data = action.payload;
        state.error = null;
      }
    );
    builder.addCase(fetchCreditsOverview.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Purchase credits
    builder.addCase(purchaseCredits.pending, (state) => {
      state.isPurchasing = true;
      state.purchaseError = null;
      state.purchaseSuccess = false;
    });
    builder.addCase(
      purchaseCredits.fulfilled,
      (state, action: PayloadAction<PurchaseResult>) => {
        state.isPurchasing = false;
        state.purchaseSuccess = true;
        state.purchaseError = null;

        // Update the credits data in-place after a successful purchase
        if (state.data) {
          state.data.totalCredits = action.payload.totalCredits;
          state.data.usedCredits = action.payload.usedCredits;
          state.data.remainingCredits = action.payload.remainingCredits;
          state.data.percentUsed =
            action.payload.totalCredits > 0
              ? parseFloat(
                  (
                    (action.payload.usedCredits / action.payload.totalCredits) *
                    100
                  ).toFixed(1)
                )
              : 0;

          // Prepend the new transaction to the list
          state.data.transactions = [
            action.payload.transaction,
            ...state.data.transactions,
          ];
        }
      }
    );
    builder.addCase(purchaseCredits.rejected, (state, action) => {
      state.isPurchasing = false;
      state.purchaseError = action.payload as string;
    });

    // Fetch transactions (paginated)
    builder.addCase(fetchTransactions.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      fetchTransactions.fulfilled,
      (state, action: PayloadAction<TransactionsResponse>) => {
        state.isLoading = false;
        state.error = null;
        state.transactionsPagination = action.payload.pagination;

        // Update transactions in data if loaded
        if (state.data) {
          state.data.transactions = action.payload.transactions;
        }
      }
    );
    builder.addCase(fetchTransactions.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

// Export actions and reducer
export const { clearError, clearPurchaseStatus } = creditsSlice.actions;
export default creditsSlice.reducer;
