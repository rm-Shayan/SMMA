import { api, ApiError } from "./api";
import type { LeadDto } from "@/types/lead";

export async function getLeadsApi(tenantId?: string): Promise<LeadDto[]> {
  try {
    const res = await api.get<LeadDto[]>("/agents/leads", { tenantId });
    return res.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Failed to load leads from server.");
  }
}
