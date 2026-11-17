import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet } from "@/services/api";

export interface MediaAssetDto {
  id: string;
  type: string;
  path: string;
  name?: string;
  created_at?: string;
}

export interface ContentItemDto {
  id: string;
  title: string;
  type: "post" | "email" | "brand";
  category: string;
  lastEdited: string;
  tags: string[];
  thumbnailGradient: string;
  contentSnippet: string;
  formatBadge?: string;
}

interface BaseQueryArgs {
  url: string;
  method?: "GET";
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, params }: BaseQueryArgs) {
  try {
    const data = await apiGet(url, { params });
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return { error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } } };
  }
}

export const contentApi = createApi({
  reducerPath: "contentApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Content"],
  endpoints: (builder) => ({
    getContentLibrary: builder.query<{ success: boolean; posts?: unknown[] }, void>({
      query: () => ({ url: "/social/posts" }),
      providesTags: [{ type: "Content", id: "LIST" }],
    }),
    getMediaAssets: builder.query<{ success: boolean; driver?: string; companyId?: string }, void>({
      query: () => ({ url: "/media/assets" }),
      providesTags: [{ type: "Content", id: "ASSETS" }],
    }),
  }),
});

export const { useGetContentLibraryQuery, useGetMediaAssetsQuery } = contentApi;
