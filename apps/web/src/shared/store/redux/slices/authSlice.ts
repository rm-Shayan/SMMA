"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getCurrentUserApi } from "@/services/authService";
import { clearSession, getSession, setActiveTenant, setSession } from "@/services/session";
import type { AuthState, User } from "@/types/auth";

export const DEFAULT_MOCK_USER: User = {
  id: "usr_ahmer_ali",
  email: "admin@styretech.com",
  name: "Ahmer Ali",
  role: "SUPERADMIN",
  tenantId: "ten_apex_growth",
};

const initialSession = typeof window !== "undefined" ? getSession() : null;

const initialState: AuthState = {
  user: initialSession?.user ?? null,
  token: initialSession?.token ?? null,
  tenantId: initialSession?.user?.tenantId ?? null,
  status: initialSession ? "succeeded" : "idle",
  error: null,
};

export const fetchCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/fetchCurrentUser",
  async () => {
    try {
      return await getCurrentUserApi();
    } catch {
      // In offline preview mode, maintain default preview user
      return DEFAULT_MOCK_USER;
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: User; tenantId?: string | null }>
    ) {
      const { token, user, tenantId } = action.payload;
      state.token = token;
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
      state.user = session.user as User;
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
        const existingName = state.user?.name;
        state.user = {
          ...action.payload,
          name: action.payload.name || existingName,
        };
        state.tenantId = action.payload.tenantId ?? state.tenantId;
        state.error = null;
        if (state.token) setSession(state.token, state.user as User);
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = "succeeded";
        state.user = DEFAULT_MOCK_USER;
      });
  },
});

export const { setCredentials, logout, setTenantId, hydrateFromStorage } =
  authSlice.actions;
export default authSlice.reducer;
