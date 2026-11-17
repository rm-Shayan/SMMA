import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

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

export const workflowsApi = createApi({
  reducerPath: "workflowsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Workflow"],
  endpoints: (builder) => ({
    getWorkflows: builder.query<unknown, void>({
      query: () => ({ url: "/workflows/", method: "GET" }),
      providesTags: [{ type: "Workflow", id: "LIST" }],
    }),
    runWorkflow: builder.mutation<unknown, { id: string; [key: string]: unknown }>({
      query: ({ id, ...body }) => ({
        url: `/workflows/${encodeURIComponent(id)}/execute`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Workflow", id: "LIST" }],
    }),
  }),
});

export const { useGetWorkflowsQuery, useRunWorkflowMutation } = workflowsApi;