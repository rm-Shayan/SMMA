/**
 * RTK Query Approvals API — /api/v1/approvals endpoints.
 *
 * Connects to live FastAPI backend approvals router.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface BackendApproval {
  id: string;
  agent_run_id: string;
  approver_id?: string | null;
  status: "pending" | "approved" | "rejected";
  decided_at?: string | null;
  run_id?: string;
  thread_key?: string | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  agent_name?: string | null;
}

export interface ApprovalsResponse {
  success: boolean;
  approvals: BackendApproval[];
}

export interface DecideApprovalPayload {
  approvalId: string;
  status: "approved" | "rejected";
}

export interface BulkDecidePayload {
  approvalIds: string[];
  status: "approved" | "rejected";
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
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

export const approvalsApi = createApi({
  reducerPath: "approvalsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Approval"],
  endpoints: (builder) => ({
    getApprovals: builder.query<ApprovalsResponse, void>({
      query: () => ({
        url: "/approvals/",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.approvals
          ? [
              ...result.approvals.map(({ id }) => ({ type: "Approval" as const, id })),
              { type: "Approval", id: "LIST" },
            ]
          : [{ type: "Approval", id: "LIST" }],
    }),

    getApproval: builder.query<{ success: boolean; approval: BackendApproval }, string>({
      query: (id) => ({
        url: `/approvals/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Approval", id }],
    }),

    decideApproval: builder.mutation<{ success: boolean; approvalId: string; status: string }, DecideApprovalPayload>({
      query: ({ approvalId, status }) => ({
        url: `/approvals/${encodeURIComponent(approvalId)}/decide`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: (_res, _err, { approvalId }) => [
        { type: "Approval", id: approvalId },
        { type: "Approval", id: "LIST" },
      ],
    }),

    bulkDecide: builder.mutation<{ success: boolean; updated: number; status: string }, BulkDecidePayload>({
      query: (body) => ({
        url: "/approvals/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Approval", id: "LIST" }],
    }),
  }),
});

export const {
  useGetApprovalsQuery,
  useGetApprovalQuery,
  useDecideApprovalMutation,
  useBulkDecideMutation,
} = approvalsApi;
