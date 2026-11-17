"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getConversationsApi,
  sendReplyApi,
  toggleEscalationApi,
} from "@/services/inboxService";
import type { ConversationDto } from "@/types/inbox";
import { ApiError } from "@/services/api";

interface InboxState {
  conversations: ConversationDto[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  platformFilter: string;
  searchQuery: string;
  sendingReply: boolean;
  togglingEscalate: boolean;
}

const initialState: InboxState = {
  conversations: [],
  loading: false,
  error: null,
  selectedId: null,
  platformFilter: "ALL",
  searchQuery: "",
  sendingReply: false,
  togglingEscalate: false,
};

export const fetchConversations = createAsyncThunk<
  ConversationDto[],
  { platform?: string; tenantId?: string },
  { rejectValue: string }
>("inbox/fetchConversations", async ({ platform, tenantId }, { rejectWithValue }) => {
  try {
    return await getConversationsApi(platform, tenantId);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to load conversations";
    return rejectWithValue(message);
  }
});

export const sendReply = createAsyncThunk<
  { conversationId: string; replyText: string },
  { conversationId: string; replyText: string; tenantId?: string },
  { rejectValue: string }
>(
  "inbox/sendReply",
  async ({ conversationId, replyText, tenantId }, { rejectWithValue }) => {
    try {
      await sendReplyApi(conversationId, replyText, tenantId);
      return { conversationId, replyText };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to send reply";
      return rejectWithValue(message);
    }
  }
);

export const toggleEscalation = createAsyncThunk<
  { conversationId: string; isEscalated: boolean },
  { conversationId: string; isEscalated: boolean; tenantId?: string },
  { rejectValue: string }
>(
  "inbox/toggleEscalation",
  async ({ conversationId, isEscalated, tenantId }, { rejectWithValue }) => {
    try {
      const res = await toggleEscalationApi(conversationId, isEscalated, tenantId);
      return { conversationId, isEscalated: res.isEscalated };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to toggle escalation";
      return rejectWithValue(message);
    }
  }
);

const inboxSlice = createSlice({
  name: "inbox",
  initialState,
  reducers: {
    setSelectedId(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    setPlatformFilter(state, action: PayloadAction<string>) {
      state.platformFilter = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        if (action.payload.length > 0) {
          if (!state.selectedId || !action.payload.some((c) => c.id === state.selectedId)) {
            state.selectedId = action.payload[0].id;
          }
        } else {
          state.selectedId = null;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load conversations";
      })
      // Send Reply
      .addCase(sendReply.pending, (state) => {
        state.sendingReply = true;
      })
      .addCase(sendReply.fulfilled, (state, action) => {
        state.sendingReply = false;
        const { conversationId, replyText } = action.payload;
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.agent_response = replyText;
          conv.is_escalated = false;
        }
      })
      .addCase(sendReply.rejected, (state) => {
        state.sendingReply = false;
      })
      // Toggle Escalation
      .addCase(toggleEscalation.pending, (state) => {
        state.togglingEscalate = true;
      })
      .addCase(toggleEscalation.fulfilled, (state, action) => {
        state.togglingEscalate = false;
        const { conversationId, isEscalated } = action.payload;
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.is_escalated = isEscalated;
        }
      })
      .addCase(toggleEscalation.rejected, (state) => {
        state.togglingEscalate = false;
      });
  },
});

export const { setSelectedId, setPlatformFilter, setSearchQuery } = inboxSlice.actions;
export default inboxSlice.reducer;

