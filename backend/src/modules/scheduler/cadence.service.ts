import { pool } from '../../core/database/pool.database';
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

export async function executeMorningIntelligence(tenant: AutonomousTenant): Promise<void> {
  logger.info({ tenantId: tenant.id, niche: tenant.niche }, '🌅 Agent #2 & #7: Running Morning Trend & Post Planner');
  const trendResult = await invokeAgentEngine({
    tenantId: tenant.id,
    channel: 'INSTAGRAM',
    incomingMessage: `Niche: ${tenant.niche}. Target Audience: ${tenant.target_audience}. Discover today's viral hook and craft 2 high-conversion posts.`,
    targetAgent: 'TREND_IDENTIFIER',
  });

  const content1 = trendResult.generatedResponse || `Scale your ${tenant.niche} business with autonomous AI workflows! Link in bio.`;
  const content2 = `Top secret hack for ${tenant.niche}: Consistency + Automation = 10x Pipeline Growth.`;

  const now = new Date();
  const postTime1 = new Date(now.getTime() + 2 * 60 * 1000); // 2 mins later (or 10 AM)
  const postTime2 = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours later (or 6 PM)

  await pool.query(
    `INSERT INTO scheduled_posts (tenant_id, platform, content, scheduled_at, status)
     VALUES ($1, 'INSTAGRAM', $2, $3, 'PENDING'), ($1, 'INSTAGRAM', $4, $5, 'PENDING');`,
    [tenant.id, content1, postTime1, content2, postTime2]
  );
  logger.info({ tenantId: tenant.id }, '📅 2 daily posts autonomously scheduled for peak engagement');
}

export async function executeCompetitorGrowthHijack(tenant: AutonomousTenant): Promise<void> {
  const competitors = tenant.competitor_handles?.length ? tenant.competitor_handles.join(', ') : 'industry leaders';
  logger.info({ tenantId: tenant.id, competitors }, '🎯 Agent #3: Running Midday Competitor Post Engagement');
  await invokeAgentEngine({
    tenantId: tenant.id,
    channel: 'INSTAGRAM',
    incomingMessage: `Competitors: ${competitors}. Niche: ${tenant.niche}. Draft authoritative value comments to attract their followers.`,
    targetAgent: 'COMPETITOR_ENGAGEMENT',
  });
}

export async function executeNightlyAnalyticsAudit(tenant: AutonomousTenant): Promise<void> {
  logger.info({ tenantId: tenant.id }, '🌙 Agent #8: Running Nightly Performance & Lead Pipeline Audit');
  await invokeAgentEngine({
    tenantId: tenant.id,
    channel: 'CRM_LIVE_CHAT',
    incomingMessage: `Audit daily lead volume and conversation conversions for ${tenant.company_name}.`,
    targetAgent: 'ANALYTICS',
  });
}

export async function runAutonomousCadenceTick(): Promise<void> {
  const sql = `
    SELECT id, company_name, niche, target_audience, competitor_handles, cadence_state
    FROM tenants 
    WHERE autonomous_mode_enabled = TRUE AND is_active = TRUE;
  `;
  try {
    const res = await pool.query(sql);
    const tenants: AutonomousTenant[] = res.rows;
    if (tenants.length === 0) return;

    const currentHour = new Date().getHours();
    const todayKey = new Date().toISOString().split('T')[0];

    for (const tenant of tenants) {
      const state = tenant.cadence_state || {};
      if (currentHour >= 8 && currentHour < 12 && state[`morning_${todayKey}`] !== 'DONE') {
        await executeMorningIntelligence(tenant);
        state[`morning_${todayKey}`] = 'DONE';
        await pool.query(`UPDATE tenants SET cadence_state = $1, last_cadence_run_at = NOW() WHERE id = $2;`, [state, tenant.id]);
      } else if (currentHour >= 14 && currentHour < 17 && state[`midday_${todayKey}`] !== 'DONE') {
        await executeCompetitorGrowthHijack(tenant);
        state[`midday_${todayKey}`] = 'DONE';
        await pool.query(`UPDATE tenants SET cadence_state = $1, last_cadence_run_at = NOW() WHERE id = $2;`, [state, tenant.id]);
      } else if (currentHour >= 22 && state[`night_${todayKey}`] !== 'DONE') {
        await executeNightlyAnalyticsAudit(tenant);
        state[`night_${todayKey}`] = 'DONE';
        await pool.query(`UPDATE tenants SET cadence_state = $1, last_cadence_run_at = NOW() WHERE id = $2;`, [state, tenant.id]);
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'Autonomous Cadence Tick failed');
  }
}

