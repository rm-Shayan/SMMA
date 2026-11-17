/**
 * RTK Query Agents API — /api/v1/agents endpoints.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPatch, apiPost } from "@/services/api";

export interface AgentDto {
  id: number | string;
  code?: string;
  name?: string;
  default_mode?: string | null;
  mode?: string | null;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface AgentRunDto {
  id: string;
  company_id: string;
  agent_action_id: string;
  agent_name?: string;
  status: "running" | "completed" | "failed" | "cancelled";
  credits_used?: number;
  cost_usd?: number;
  started_at: string;
  finished_at?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface AgentsResponse {
  success: boolean;
  agents: AgentDto[];
}

export interface RunsResponse {
  success: boolean;
  runs: AgentRunDto[];
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, method = "GET", body, params }: BaseQueryArgs) {
  try {
    let data;
    if (method === "POST") {
      data = await apiPost(url, body, { params });
    } else if (method === "PATCH") {
      data = await apiPatch(url, body, { params });
    } else {
      data = await apiGet(url, { params });
    }
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } },
    };
  }
}

export const agentsApi = createApi({
  reducerPath: "agentsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Agent", "AgentRun"],
  endpoints: (builder) => ({
    getAgents: builder.query<AgentsResponse, void>({
      query: () => ({ url: "/agents", method: "GET" }),
      providesTags: (result) =>
        result?.agents
          ? [
              ...result.agents.map((a) => ({ type: "Agent" as const, id: String(a.id) })),
              { type: "Agent", id: "LIST" },
            ]
          : [{ type: "Agent", id: "LIST" }],
    }),

    getRuns: builder.query<RunsResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/agents/runs",
        method: "GET",
        params: arg ? { limit: arg.limit } : undefined,
      }),
      providesTags: [{ type: "AgentRun", id: "LIST" }],
    }),

    getRunDetail: builder.query<{ success: boolean; run: AgentRunDto }, string>({
      query: (runId) => ({ url: `/agents/runs/${encodeURIComponent(runId)}`, method: "GET" }),
      providesTags: (_res, _err, id) => [{ type: "AgentRun", id }],
    }),

    runAgent: builder.mutation<
      { success: boolean; runId?: string; data?: unknown; error?: string },
      { id: number | string; input?: Record<string, unknown>; mode?: "draft" | "auto"; actionId?: string }
    >({
      query: ({ id, input = {}, mode = "auto", actionId }) => ({
        url: `/agents/${encodeURIComponent(String(id))}/run`,
        method: "POST",
        body: { input, mode, actionId },
      }),
      invalidatesTags: [{ type: "AgentRun", id: "LIST" }],
    }),

    cancelRun: builder.mutation<{ success: boolean; runId: string }, string>({
      query: (runId) => ({
        url: `/agents/runs/${encodeURIComponent(runId)}/cancel`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "AgentRun", id: "LIST" }],
    }),

    updateAgentMode: builder.mutation<
      { success?: boolean; agent?: AgentDto },
      { id: number | string; mode: "draft" | "auto" }
    >({
      query: ({ id, mode }) => ({
        url: `/agents/${encodeURIComponent(String(id))}`,
        method: "PATCH",
        body: { mode },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Agent", id: String(id) },
        { type: "Agent", id: "LIST" },
      ],
    }),

    enableAgent: builder.mutation<
      { success: boolean; agentId: number; companyId: string; enabled: boolean },
      number | string
    >({
      query: (agentId) => ({
        url: `/agents/company/${encodeURIComponent(String(agentId))}/enable`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Agent", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAgentsQuery,
  useGetRunsQuery,
  useGetRunDetailQuery,
  useRunAgentMutation,
  useCancelRunMutation,
  useUpdateAgentModeMutation,
  useEnableAgentMutation,
} = agentsApi;
