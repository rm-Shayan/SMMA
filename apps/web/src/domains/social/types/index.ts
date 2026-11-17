export interface SocialPost {
  id: string;
  companyId: string;
  channel: string;
  title?: string;
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: "draft" | "pending_approval" | "scheduled" | "published" | "failed";
}

export interface SocialComment {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  sentiment?: "positive" | "neutral" | "negative";
  aiReplyDraft?: string;
  status: "unanswered" | "replied" | "hidden";
  createdAt: string;
}

export interface OutboxJob {
  id: string;
  postId: string;
  platform: string;
  status: "queued" | "sending" | "delivered" | "failed";
  retryCount: number;
  nextRetryAt?: string;
}
