import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';
import { invokeAgentEngine } from '../agents/agent.workflow';

export interface AutonomousTenant {
  id: string;
  company_name: string;
  niche: string;
  target_audience: string;
  competitor_handles: string[];
  cadence_state: Record<string, string>;
}

const SYSTEM_ACTOR = { role: 'SUPERADMIN' as const, userId: 'system-cadence' };

export async function executeMorningIntelligence(tenant: AutonomousTenant): Promise<void> {
  logger.info({ tenantId: tenant.id }, 'Cadence: morning intelligence');
  const trendResult = await invokeAgentEngine({
    tenantId: tenant.id,
    channel: 'INSTAGRAM',
    incomingMessage: `Niche: ${tenant.niche}. Target Audience: ${tenant.target_audience}. Discover today's viral hook and craft 2 high-conversion posts.`,
    targetAgent: 'TREND_IDENTIFIER',
    actor: { ...SYSTEM_ACTOR, tenantId: tenant.id },
  });
  const content1 = trendResult.generatedResponse || `Scale your ${tenant.niche} business with autonomous AI workflows.`;
  const content2 = `Growth tip for ${tenant.niche}: Consistency + Automation.`;
  const now = new Date();
  const postTime1 = new Date(now.getTime() + 2 * 60 * 1000);
  const postTime2 = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  await executeTenantQuery(tenant.id,
    `INSERT INTO scheduled_posts (tenant_id, platform, content, scheduled_at, status) VALUES ($1,'INSTAGRAM',$2,$3,'PENDING'),($1,'INSTAGRAM',$4,$5,'PENDING');`,
    [tenant.id, content1, postTime1, content2, postTime2]
  );
}

export async function executeCompetitorGrowthHijack(tenant: AutonomousTenant): Promise<void> {
  const competitors = tenant.competitor_handles?.length ? tenant.competitor_handles.join(', ') : 'industry leaders';
  await invokeAgentEngine({
    tenantId: tenant.id,
    channel: 'INSTAGRAM',
    incomingMessage: `Competitors: ${competitors}. Niche: ${tenant.niche}. Draft authoritative value comments.`,
    targetAgent: 'COMPETITOR_ENGAGEMENT',
    actor: { ...SYSTEM_ACTOR, tenantId: tenant.id },
  });
}

export async function executeNightlyAnalyticsAudit(tenant: AutonomousTenant): Promise<void> {
  await invokeAgentEngine({
    tenantId: tenant.id,
    channel: 'CRM_LIVE_CHAT',
    incomingMessage: `Audit daily lead volume and conversation conversions for ${tenant.company_name}.`,
    targetAgent: 'ANALYTICS',
    actor: { ...SYSTEM_ACTOR, tenantId: tenant.id },
  });
}

export async function runAutonomousCadenceTick(): Promise<void> {
  const sql = `SELECT id, company_name, niche, target_audience, competitor_handles, cadence_state FROM tenants WHERE autonomous_mode_enabled = TRUE AND is_active = TRUE;`;
  try {
    const res = await pool.query(sql); // system-wide job
    const tenants: AutonomousTenant[] = res.rows;
    if (!tenants.length) return;
    const currentHour = new Date().getHours();
    const todayKey = new Date().toISOString().split('T')[0];
    for (const tenant of tenants) {
      const state = tenant.cadence_state || {};
      if (currentHour >= 8 && currentHour < 12 && state[`morning_${todayKey}`] !== 'DONE') {
        await executeMorningIntelligence(tenant);
        state[`morning_${todayKey}`] = 'DONE';
        await executeTenantQuery(tenant.id, `UPDATE tenants SET cadence_state = $1, last_cadence_run_at = NOW() WHERE id = $2;`, [state, tenant.id]);
      } else if (currentHour >= 14 && currentHour < 17 && state[`midday_${todayKey}`] !== 'DONE') {
        await executeCompetitorGrowthHijack(tenant);
        state[`midday_${todayKey}`] = 'DONE';
        await executeTenantQuery(tenant.id, `UPDATE tenants SET cadence_state = $1, last_cadence_run_at = NOW() WHERE id = $2;`, [state, tenant.id]);
      } else if (currentHour >= 22 && state[`night_${todayKey}`] !== 'DONE') {
        await executeNightlyAnalyticsAudit(tenant);
        state[`night_${todayKey}`] = 'DONE';
        await executeTenantQuery(tenant.id, `UPDATE tenants SET cadence_state = $1, last_cadence_run_at = NOW() WHERE id = $2;`, [state, tenant.id]);
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'Autonomous cadence tick failed');
  }
}
