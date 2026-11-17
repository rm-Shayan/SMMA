import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface GenerateImagePayload {
  prompt: string;
  platform?: string;
}

export interface GenerateAudioPayload {
  text: string;
  lang?: string;
}

export interface GenerateVideoPayload {
  prompt: string;
  script: string;
  lang?: string;
}

export interface MediaGenerationResponse {
  success: boolean;
  path?: string;
  type?: string;
  video?: string;
  audio?: string;
  image?: string;
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
    return { error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } } };
  }
}

export const mediaApi = createApi({
  reducerPath: "mediaApi",
  baseQuery: customBaseQuery,
  tagTypes: ["MediaAsset"],
  endpoints: (builder) => ({
    getMediaAssets: builder.query<{ success: boolean; driver: string; companyId: string }, void>({
      query: () => ({ url: "/media/assets", method: "GET" }),
      providesTags: [{ type: "MediaAsset", id: "LIST" }],
    }),

    generateImage: builder.mutation<MediaGenerationResponse, GenerateImagePayload>({
      query: (body) => ({
        url: "/media/image",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "MediaAsset", id: "LIST" }],
    }),

    generateVoiceover: builder.mutation<MediaGenerationResponse, GenerateAudioPayload>({
      query: (body) => ({
        url: "/media/voiceover",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "MediaAsset", id: "LIST" }],
    }),

    generateVideo: builder.mutation<MediaGenerationResponse, GenerateVideoPayload>({
      query: (body) => ({
        url: "/media/video",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "MediaAsset", id: "LIST" }],
    }),
  }),
});

export const {
  useGetMediaAssetsQuery,
  useGenerateImageMutation,
  useGenerateVoiceoverMutation,
  useGenerateVideoMutation,
} = mediaApi;
