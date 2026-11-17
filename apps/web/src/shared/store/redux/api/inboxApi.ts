/**
 * RTK Query Inbox API — /api/v1/inbox endpoints.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface InboxThreadDto {
  id: string;
  channel?: string | null;
  thread_key?: string | null;
  external_sender_id?: string | null;
  status?: string | null;
  last_message_at?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
}

export interface InboxMessageDto {
  id: string;
  conversation_id?: string;
  direction?: string | null; // inbound | outbound
  sender?: string | null;
  body?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface ThreadsResponse {
  success: boolean;
  threads: InboxThreadDto[];
}

export interface MessagesResponse {
  success: boolean;
  threadId: string;
  messages: InboxMessageDto[];
}

export interface SendReplyPayload {
  threadId: string;
  message: string;
  autoApprove?: boolean;
}

export interface AiReplyResponse {
  success: boolean;
  suggestion?: unknown;
  error?: string;
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, method = "GET", body, params }: BaseQueryArgs) {
  try {
    const data =
      method === "POST"
        ? await apiPost(url, body, { params })
        : await apiGet(url, { params });
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } },
    };
  }
}

export const inboxApi = createApi({
  reducerPath: "inboxApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Thread", "Messages"],
  endpoints: (builder) => ({
    getThreads: builder.query<ThreadsResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/inbox/threads",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: (result) =>
        result?.threads
          ? [
              ...result.threads.map(({ id }) => ({ type: "Thread" as const, id })),
              { type: "Thread", id: "LIST" },
            ]
          : [{ type: "Thread", id: "LIST" }],
    }),

    getMessages: builder.query<MessagesResponse, string>({
      query: (threadId) => ({
        url: `/inbox/threads/${encodeURIComponent(threadId)}/messages`,
        method: "GET",
      }),
      providesTags: (_res, _err, threadId) => [{ type: "Messages", id: threadId }],
    }),

    sendMessage: builder.mutation<{ success: boolean; messageId?: string; outboxJobId?: string; error?: string }, SendReplyPayload>({
      query: ({ threadId, message, autoApprove = true }) => ({
        url: `/inbox/threads/${encodeURIComponent(threadId)}/reply`,
        method: "POST",
        body: { message, autoApprove },
      }),
      invalidatesTags: (_res, _err, { threadId }) => [
        { type: "Messages", id: threadId },
        { type: "Thread", id: "LIST" },
      ],
    }),

    triggerAiDraft: builder.mutation<AiReplyResponse, { threadId: string; tone?: string; language?: string }>({
      query: ({ threadId, tone = "professional", language = "roman_urdu" }) => ({
        url: `/inbox/threads/${encodeURIComponent(threadId)}/ai-reply`,
        method: "POST",
        body: { tone, language },
      }),
    }),
  }),
});

export const {
  useGetThreadsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useTriggerAiDraftMutation,
} = inboxApi;
