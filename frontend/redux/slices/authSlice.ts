"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getCurrentUserApi } from "@/services/authService";
import { clearSession, getSession, setActiveTenant, setSession } from "@/services/session";
import type { AuthState, User } from "@/types/auth";

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  tenantId: null,
  status: "idle",
  error: null,
};

export const fetchCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentUserApi();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch current user";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; refreshToken?: string | null; user: User; tenantId?: string | null }>
    ) {
      const { token, refreshToken, user, tenantId } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken ?? null;
      state.user = user;
      state.tenantId = tenantId ?? user.tenantId ?? null;
      state.status = "succeeded";
      state.error = null;
      setSession(token, user);
      if (state.tenantId) setActiveTenant(state.tenantId);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tenantId = null;
      state.status = "idle";
      state.error = null;
      clearSession();
    },
    setTenantId(state, action: PayloadAction<string | null>) {
      state.tenantId = action.payload;
      setActiveTenant(action.payload);
    },
    hydrateFromStorage(state) {
      const session = getSession();
      if (!session) return;
      state.token = session.token;
      state.user = session.user;
      state.tenantId = session.user.tenantId;
      state.status = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.tenantId = action.payload.tenantId ?? state.tenantId;
        state.error = null;
        if (state.token) setSession(state.token, action.payload);
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch current user";
      });
  },
});

export const { setCredentials, logout, setTenantId, hydrateFromStorage } =
  authSlice.actions;
export default authSlice.reducer;
