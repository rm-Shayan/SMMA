export type PublishPlatform = "linkedin" | "instagram" | "twitter" | "facebook";

export interface SchedulePostPayload {
  platform: PublishPlatform;
  draftContent: string;
  imageUrl?: string;
  autoScheduleOptimal?: boolean;
  exactTime?: string;
  tenantId?: string;
}

export interface SchedulePostResponse {
  success: boolean;
  scheduledPostId: string;
  status: string;
  message?: string;
}

