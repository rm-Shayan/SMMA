/**
 * Dashboard analytics API calls.
 * Contract: docs/07-api-integration.md §4 (row 6).
 *
 * `GET /analytics` uses the caller's tenant (from the JWT).
 * `GET /analytics/:tenantId` is used when a SUPERADMIN has an active tenant;
 * the tenant is also sent as `x-tenant-id` by the shared Axios interceptor.
 */
import { apiGet } from "@/services/api";
import type { Analytics, AnalyticsResponse } from "@/types/analytics";

export async function getAnalyticsApi(tenantId?: string): Promise<Analytics> {
  const path = tenantId ? `/analytics/${encodeURIComponent(tenantId)}` : "/analytics";
  const res = await apiGet<AnalyticsResponse>(path, tenantId ? { tenantId } : undefined);

  if (!res?.analytics) {
    throw new Error("The analytics response was empty.");
  }

  // Defensive normalisation: counts must always be numbers for rendering.
  return {
    ...res.analytics,
    totalLeads: Number(res.analytics.totalLeads) || 0,
    hotLeads: Number(res.analytics.hotLeads) || 0,
    totalConversations: Number(res.analytics.totalConversations) || 0,
    totalScheduledPosts: Number(res.analytics.totalScheduledPosts) || 0,
    publishedPosts: Number(res.analytics.publishedPosts) || 0,
    platformBreakdown: res.analytics.platformBreakdown ?? {},
  };
}
