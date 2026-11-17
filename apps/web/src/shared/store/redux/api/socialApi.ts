/**
 * RTK Query Social/Publishing API — /api/v1/social endpoints.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface SocialPostDto {
  id: string;
  connected_account_id?: string | null;
  platform?: string | null;
  content?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface PostsResponse {
  success: boolean;
  posts: SocialPostDto[];
}

export interface CreatePostPayload {
  connectedAccountId: string;
  platform: string;
  topic?: string;
  tone?: string;
  scheduledAt?: string | null;
  autoApprove?: boolean;
}

export interface CreatePostResponse {
  success?: boolean;
  data?: unknown;
  runId?: string;
  post?: SocialPostDto;
  [key: string]: unknown;
}

export interface CalendarItemDto {
  id: string;
  platform?: string | null;
  status?: string | null;
  content?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  [key: string]: unknown;
}

export interface CalendarResponse {
  success: boolean;
  items: CalendarItemDto[];
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

export const socialApi = createApi({
  reducerPath: "socialApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Post", "Calendar", "Comment"],
  endpoints: (builder) => ({
    getPosts: builder.query<PostsResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/social/posts",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: (result) =>
        result?.posts
          ? [
              ...result.posts.map(({ id }) => ({ type: "Post" as const, id })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    createPost: builder.mutation<CreatePostResponse, CreatePostPayload>({
      query: (body) => ({
        url: "/social/posts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Post", id: "LIST" }, { type: "Calendar", id: "LIST" }],
    }),

    publishPost: builder.mutation<{ success: boolean; postId?: string; status?: string; error?: string }, string>({
      query: (postId) => ({
        url: `/social/posts/${encodeURIComponent(postId)}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, postId) => [
        { type: "Post", id: postId },
        { type: "Post", id: "LIST" },
        { type: "Calendar", id: "LIST" },
      ],
    }),

    getCalendar: builder.query<CalendarResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/social/calendar",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: "Calendar" as const, id })),
              { type: "Calendar", id: "LIST" },
            ]
          : [{ type: "Calendar", id: "LIST" }],
    }),

    getComments: builder.query<{ success: boolean; comments: unknown[] }, { limit?: number } | void>({
      query: (arg) => ({
        url: "/social/comments",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: [{ type: "Comment", id: "LIST" }],
    }),

    replyComment: builder.mutation<{ success: boolean; commentId?: string; error?: string }, { commentId: string; body: string }>({
      query: ({ commentId, body }) => ({
        url: `/social/comments/${encodeURIComponent(commentId)}/reply`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: [{ type: "Comment", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  usePublishPostMutation,
  useGetCalendarQuery,
  useGetCommentsQuery,
  useReplyCommentMutation,
} = socialApi;

export const useGetSocialPostsQuery = useGetPostsQuery;
