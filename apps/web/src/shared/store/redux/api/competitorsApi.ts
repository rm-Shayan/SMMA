import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface CompetitorDto {
  id: string;
  name: string;
  website?: string | null;
  social_handles?: unknown;
  keywords?: unknown;
}

export interface CompetitorsResponse {
  success: boolean;
  competitors: CompetitorDto[];
}

export interface CompetitorInsightDto {
  id: string;
  type?: string | null;
  data?: unknown;
  captured_at?: string | null;
  competitor?: string | null;
}

export interface CompetitorInsightsResponse {
  success: boolean;
  insights: CompetitorInsightDto[];
}

export interface CreateCompetitorPayload {
  name: string;
  website?: string;
  keywords?: string;
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
    const error = err as { status?: number; message?: string };
    return {
      error: {
        status: error.status ?? 0,
        data: { message: error.message ?? "Request failed" },
      },
    };
  }
}

export const competitorsApi = createApi({
  reducerPath: "competitorsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Competitor", "CompetitorInsight"],
  endpoints: (builder) => ({
    getCompetitors: builder.query<CompetitorsResponse, void>({
      query: () => ({ url: "/social/competitors", method: "GET" }),
      providesTags: (result) =>
        result?.competitors
          ? [
              ...result.competitors.map(({ id }) => ({ type: "Competitor" as const, id })),
              { type: "Competitor", id: "LIST" },
            ]
          : [{ type: "Competitor", id: "LIST" }],
    }),

    getCompetitorInsights: builder.query<CompetitorInsightsResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/social/competitor-insights",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: [{ type: "CompetitorInsight", id: "LIST" }],
    }),

    createCompetitor: builder.mutation<
      { success: boolean; competitor: CompetitorDto },
      CreateCompetitorPayload
    >({
      query: (body) => ({ url: "/social/competitors", method: "POST", body }),
      invalidatesTags: [{ type: "Competitor", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCompetitorsQuery,
  useGetCompetitorInsightsQuery,
  useCreateCompetitorMutation,
} = competitorsApi;
