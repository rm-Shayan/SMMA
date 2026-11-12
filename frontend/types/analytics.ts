/**
 * Types for `GET /analytics` and `GET /analytics/:tenantId`.
 * Source of truth: backend/src/modules/analytics/analytics.service.ts (AnalyticsSummary).
 */

/** Raw `analytics` payload returned by the API (aggregate totals only). */
export interface AnalyticsDto {
  tenantId: string;
  totalLeads: number;
  hotLeads: number;
  totalConversations: number;
  totalScheduledPosts: number;
  publishedPosts: number;
  /** Conversation count per platform, e.g. `{ INSTAGRAM: 12, WHATSAPP: 3 }`. */
  platformBreakdown: Record<string, number>;
}

/** Envelope: `{ success: true, analytics }`. */
export interface AnalyticsResponse {
  success: boolean;
  analytics: AnalyticsDto;
}

/** Page-facing view model — the backend fields are already camelCase. */
export type Analytics = AnalyticsDto;
