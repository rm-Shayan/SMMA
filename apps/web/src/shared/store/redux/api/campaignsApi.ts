/**
 * RTK Query Campaigns API — /api/v1/campaigns endpoints.
 *
 * Contract (backend `app/modules/campaigns/router.py`):
 *  - GET    /campaigns            -> { success, campaigns: CampaignRow[] }
 *  - POST   /campaigns/           -> { success, campaignId, agentRunId, data }
 *  - PATCH  /campaigns/{id}?status= -> { success, campaignId }  (status is a QUERY param, not body)
 *  - GET    /campaigns/{id}/analytics -> { success, analytics: { recipients, sent, replied } }
 *  - GET    /connectors/accounts  -> { success, accounts } (needed for connectedAccountId)
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost, apiPatch } from "@/services/api";

/** Raw row returned by GET /campaigns (snake_case, straight from Postgres). */
export interface CampaignRow {
  id: string;
  company_id: string;
  user_id: string;
  connected_account_id?: string | null;
  list_id?: string | null;
  goal?: string | null;
  tone?: string | null;
  followup_rules?: unknown;
  credit_limit?: number | null;
  status?: string | null;
  created_at?: string;
}

export interface CampaignsResponse {
  success: boolean;
  campaigns: CampaignRow[];
}

export interface ProspectInput {
  name: string;
  email: string;
  companyName?: string;
  topic?: string;
}

export interface CreateCampaignPayload {
  connectedAccountId: string;
  goal: string; // min 5 chars (backend Field(min_length=5))
  tone?: string;
  mode?: "draft" | "auto";
  prospects: ProspectInput[]; // min 1
}

export interface CreateCampaignResponse {
  success: boolean;
  campaignId: string;
  agentRunId: string;
  data?: unknown;
}

export interface CampaignAnalytics {
  success: boolean;
  analytics: { recipients: number; sent: number; replied: number };
}

export interface ConnectedAccount {
  id: string;
  provider: string;
  display_name: string;
  status: string;
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, method = "GET", body, params }: BaseQueryArgs) {
  try {
    let data: unknown;
    switch (method) {
      case "POST":
        data = await apiPost(url, body, { params });
        break;
      case "PATCH":
        data = await apiPatch(url, body, { params });
        break;
      case "GET":
      default:
        data = await apiGet(url, { params });
        break;
    }
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } },
    };
  }
}

export const campaignsApi = createApi({
  reducerPath: "campaignsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Campaign", "CampaignList", "ConnectedAccount"],
  endpoints: (builder) => ({
    getCampaigns: builder.query<CampaignsResponse, void>({
      query: () => ({ url: "/campaigns/", method: "GET" }),
      providesTags: (result) =>
        result?.campaigns
          ? [
              ...result.campaigns.map(({ id }) => ({ type: "Campaign" as const, id })),
              { type: "CampaignList", id: "LIST" },
            ]
          : [{ type: "CampaignList", id: "LIST" }],
    }),

    getCampaign: builder.query<{ success: boolean; campaign: CampaignRow | null }, string>({
      query: (id) => ({ url: `/campaigns/${encodeURIComponent(id)}`, method: "GET" }),
      providesTags: (_res, _err, id) => [{ type: "Campaign", id }],
    }),

    createCampaign: builder.mutation<CreateCampaignResponse, CreateCampaignPayload>({
      query: (body) => ({ url: "/campaigns/", method: "POST", body }),
      invalidatesTags: [{ type: "CampaignList", id: "LIST" }],
    }),

    /**
     * Pause / resume a campaign. Backend reads `status` from the QUERY string
     * (FastAPI args, not body) — values: "active" | "paused".
     */
    updateCampaignStatus: builder.mutation<
      { success: boolean; campaignId: string },
      { id: string; status: "active" | "paused" }
    >({
      query: ({ id, status }) => ({
        url: `/campaigns/${encodeURIComponent(id)}`,
        method: "PATCH",
        params: { status },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Campaign", id },
        { type: "CampaignList", id: "LIST" },
      ],
    }),

    getCampaignAnalytics: builder.query<CampaignAnalytics, string>({
      query: (id) => ({
        url: `/campaigns/${encodeURIComponent(id)}/analytics`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Campaign", id }],
    }),

    /** Sending accounts — POST /campaigns needs a connectedAccountId. */
    getConnectedAccounts: builder.query<{ success: boolean; accounts: ConnectedAccount[] }, void>({
      query: () => ({ url: "/connectors/accounts", method: "GET" }),
      providesTags: [{ type: "ConnectedAccount" }],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignStatusMutation,
  useGetCampaignAnalyticsQuery,
  useLazyGetCampaignAnalyticsQuery,
  useGetConnectedAccountsQuery,
} = campaignsApi;
