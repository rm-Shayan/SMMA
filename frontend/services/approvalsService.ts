import { apiGet, apiPost } from "@/services/api";

export interface ApprovalItem {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  actor_role: string;
  tool_name: string;
  proposed_params: Record<string, any>;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED" | "EXPIRED";
  decision_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  execution_result: any;
  created_at: string;
}

export async function listApprovalsApi(tenantId?: string): Promise<{ success: boolean; count: number; approvals: ApprovalItem[] }> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
  return apiGet(`/approvals${query}`);
}

export async function approveActionApi(id: string, reason?: string, tenantId?: string): Promise<{ success: boolean; execution: any }> {
  return apiPost(`/approvals/${id}/approve`, { reason, tenantId });
}

export async function rejectActionApi(id: string, reason: string, tenantId?: string): Promise<{ success: boolean; message: string }> {
  return apiPost(`/approvals/${id}/reject`, { reason, tenantId });
}

