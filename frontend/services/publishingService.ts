import { apiPost } from "@/services/api";

export interface SchedulePostPayload {
  platform: "linkedin" | "instagram" | "twitter" | "facebook";
  draftContent: string;
  imageUrl?: string;
  autoScheduleOptimal?: boolean;
  exactTime?: string;
}

export interface SchedulePostResult {
  success: boolean;
  postId?: string;
  formattedContent?: string;
  error?: string;
}

export async function schedulePostApi(payload: SchedulePostPayload): Promise<SchedulePostResult> {
  return await apiPost<SchedulePostResult>("/scheduler/publish", payload);
}

