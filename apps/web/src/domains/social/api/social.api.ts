import { httpClient } from "@/shared/http/client";
import type { SocialPost, SocialComment } from "../types";

export const socialApi = {
  getPosts: async (params?: Record<string, unknown>): Promise<SocialPost[]> => {
    const res = await httpClient.get("/social/posts", { params });
    return res.data;
  },

  createPost: async (payload: Partial<SocialPost>): Promise<SocialPost> => {
    const res = await httpClient.post("/social/posts", payload);
    return res.data;
  },

  approvePost: async (postId: string): Promise<SocialPost> => {
    const res = await httpClient.post(`/social/posts/${postId}/approve`);
    return res.data;
  },

  publishPost: async (postId: string): Promise<SocialPost> => {
    const res = await httpClient.post(`/social/posts/${postId}/publish`);
    return res.data;
  },

  regeneratePost: async (postId: string, feedback?: string): Promise<SocialPost> => {
    const res = await httpClient.post(`/social/posts/${postId}/regenerate`, { feedback });
    return res.data;
  },

  getCalendar: async (): Promise<unknown[]> => {
    const res = await httpClient.get("/social/calendar");
    return res.data?.items ?? [];
  },

  getComments: async (postId?: string): Promise<SocialComment[]> => {
    const res = await httpClient.get("/social/comments", {
      params: postId ? { post_id: postId } : undefined,
    });
    return res.data;
  },

  approveComment: async (commentId: string) => {
    const res = await httpClient.post(`/social/comments/${commentId}/approve`);
    return res.data;
  },

  replyToComment: async (commentId: string, replyText: string) => {
    const res = await httpClient.post(`/social/comments/${commentId}/reply`, {
      body: replyText,
      content: replyText,
    });
    return res.data;
  },
};
