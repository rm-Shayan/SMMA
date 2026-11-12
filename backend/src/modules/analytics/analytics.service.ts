import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';

export interface AnalyticsSummary {
  tenantId: string;
  totalLeads: number;
  hotLeads: number;
  totalConversations: number;
  totalScheduledPosts: number;
  publishedPosts: number;
  platformBreakdown: Record<string, number>;
  totalTenants?: number;
}

export async function getSystemWideAnalytics(): Promise<AnalyticsSummary> {
  try {
    const leadsRes = await pool.query(
      `SELECT count(*) as total, count(*) FILTER (WHERE lead_score >= 80) as hot_leads FROM client_leads;`
    );
    const convRes = await pool.query(
      `SELECT platform, count(*) as count FROM tenant_conversations GROUP BY platform;`
    );
    const postsRes = await pool.query(
      `SELECT count(*) as total, count(*) FILTER (WHERE status = 'PUBLISHED') as published FROM scheduled_posts;`
    );
    const tenantCountRes = await pool.query(
      `SELECT count(*) as total FROM tenants WHERE is_active = true;`
    );

    const platformBreakdown: Record<string, number> = {};
    let totalConv = 0;
    convRes.rows.forEach((r: any) => {
      platformBreakdown[r.platform] = parseInt(r.count, 10) || 0;
      totalConv += parseInt(r.count, 10) || 0;
    });

    return {
      tenantId: 'system-wide',
      totalLeads: parseInt(leadsRes.rows[0]?.total || '0', 10),
      hotLeads: parseInt(leadsRes.rows[0]?.hot_leads || '0', 10),
      totalConversations: totalConv,
      totalScheduledPosts: parseInt(postsRes.rows[0]?.total || '0', 10),
      publishedPosts: parseInt(postsRes.rows[0]?.published || '0', 10),
      platformBreakdown,
      totalTenants: parseInt(tenantCountRes.rows[0]?.total || '0', 10),
    };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to compute system-wide analytics');
    return {
      tenantId: 'system-wide',
      totalLeads: 0,
      hotLeads: 0,
      totalConversations: 0,
      totalScheduledPosts: 0,
      publishedPosts: 0,
      platformBreakdown: {},
      totalTenants: 0,
    };
  }
}

export async function getTenantAnalytics(tenantId: string): Promise<AnalyticsSummary> {
  try {
    const leadsRes = await executeTenantQuery(
      tenantId,
      `SELECT count(*) as total, count(*) FILTER (WHERE lead_score >= 80) as hot_leads FROM client_leads WHERE tenant_id = $1;`,
      [tenantId]
    );
    const convRes = await executeTenantQuery(
      tenantId,
      `SELECT platform, count(*) as count FROM tenant_conversations WHERE tenant_id = $1 GROUP BY platform;`,
      [tenantId]
    );
    const postsRes = await executeTenantQuery(
      tenantId,
      `SELECT count(*) as total, count(*) FILTER (WHERE status = 'PUBLISHED') as published FROM scheduled_posts WHERE tenant_id = $1;`,
      [tenantId]
    );

    const platformBreakdown: Record<string, number> = {};
    let totalConv = 0;
    convRes.rows.forEach((r: any) => {
      platformBreakdown[r.platform] = parseInt(r.count, 10) || 0;
      totalConv += parseInt(r.count, 10) || 0;
    });

    return {
      tenantId,
      totalLeads: parseInt(leadsRes.rows[0]?.total || '0', 10),
      hotLeads: parseInt(leadsRes.rows[0]?.hot_leads || '0', 10),
      totalConversations: totalConv,
      totalScheduledPosts: parseInt(postsRes.rows[0]?.total || '0', 10),
      publishedPosts: parseInt(postsRes.rows[0]?.published || '0', 10),
      platformBreakdown,
    };
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to compute analytics');
    return { tenantId, totalLeads: 0, hotLeads: 0, totalConversations: 0, totalScheduledPosts: 0, publishedPosts: 0, platformBreakdown: {} };
  }
}
