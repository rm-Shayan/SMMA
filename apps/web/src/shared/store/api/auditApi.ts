import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet } from "@/services/api";

export interface AuditLogItem {
  id: string;
  company_id: string;
  user_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogsResponse {
  success: boolean;
  auditLogs: AuditLogItem[];
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

export const auditApi = createApi({
  reducerPath: "auditApi",
  baseQuery: customBaseQuery,
  tagTypes: ["AuditLog"],
  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLogsResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/admin/audit-logs",
        params: { limit: arg?.limit ?? 100 },
      }),
      providesTags: [{ type: "AuditLog", id: "LIST" }],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;
