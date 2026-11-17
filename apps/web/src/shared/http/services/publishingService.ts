import { apiPost } from "@/services/api";
import type { SchedulePostPayload, SchedulePostResponse } from "@/types/publishing";

export async function publishPostApi(payload: SchedulePostPayload): Promise<SchedulePostResponse> {
  return apiPost<SchedulePostResponse>(
    "/posts/publish",
    payload,
    payload.tenantId ? { tenantId: payload.tenantId } : undefined
  );
}

