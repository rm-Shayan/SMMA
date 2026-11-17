"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getLeadsApi } from "@/services/leadsService";
import type { LeadDto } from "@/types/lead";
import { ApiError } from "@/services/api";

interface LeadsState {
  leads: LeadDto[];
  loading: boolean;
  error: string | null;
  selectedLead: LeadDto | null;
}

const initialState: LeadsState = {
  leads: [],
  loading: false,
  error: null,
  selectedLead: null,
};

export const fetchLeads = createAsyncThunk<
  LeadDto[],
  string | undefined,
  { rejectValue: string }
>("leads/fetchLeads", async (tenantId, { rejectWithValue }) => {
  try {
    return await getLeadsApi(tenantId);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to load leads";
    return rejectWithValue(message);
  }
});

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    setSelectedLead(state, action: PayloadAction<LeadDto | null>) {
      state.selectedLead = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload;
        state.error = null;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load leads";
      });
  },
});

export const { setSelectedLead } = leadsSlice.actions;
export default leadsSlice.reducer;

