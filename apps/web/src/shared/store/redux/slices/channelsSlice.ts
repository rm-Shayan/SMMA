"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getChannelsApi,
  connectChannelApi,
  disconnectChannelApi,
} from "@/services/channelsService";
import type { ConnectedChannelDto, SaveChannelPayload } from "@/types/channel";
import { ApiError } from "@/services/api";

interface ChannelsState {
  channels: ConnectedChannelDto[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: ChannelsState = {
  channels: [],
  loading: false,
  submitting: false,
  error: null,
};

export const fetchChannels = createAsyncThunk<
  ConnectedChannelDto[],
  string | undefined,
  { rejectValue: string }
>("channels/fetchChannels", async (tenantId, { rejectWithValue }) => {
  try {
    return await getChannelsApi(tenantId);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to load connected channels";
    return rejectWithValue(message);
  }
});

export const connectChannel = createAsyncThunk<
  ConnectedChannelDto,
  SaveChannelPayload,
  { rejectValue: string }
>("channels/connectChannel", async (payload, { rejectWithValue }) => {
  try {
    return await connectChannelApi(payload);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to connect channel";
    return rejectWithValue(message);
  }
});

export const disconnectChannel = createAsyncThunk<
  string,
  { platform: string; tenantId?: string },
  { rejectValue: string }
>("channels/disconnectChannel", async ({ platform, tenantId }, { rejectWithValue }) => {
  try {
    await disconnectChannelApi(platform, tenantId);
    return platform;
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to disconnect channel";
    return rejectWithValue(message);
  }
});

const channelsSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = action.payload;
        state.error = null;
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load channels";
      })
      // Connect
      .addCase(connectChannel.pending, (state) => {
        state.submitting = true;
      })
      .addCase(connectChannel.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.channels.findIndex((c) => c.platform === action.payload.platform);
        if (index >= 0) {
          state.channels[index] = action.payload;
        } else {
          state.channels.push(action.payload);
        }
      })
      .addCase(connectChannel.rejected, (state) => {
        state.submitting = false;
      })
      // Disconnect
      .addCase(disconnectChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(
          (c) => c.platform.toLowerCase() !== action.payload.toLowerCase()
        );
      });
  },
});

export default channelsSlice.reducer;

