import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';
import { logAiOperation } from '../agents/agent.audit';

const RegisterTenantSchema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  brandVoice: z.string().default('Professional, authoritative, high-conversion'),
  niche: z.string().default('General Marketing & Sales Automation'),
  targetAudience: z.string().default('Business owners and prospective clients'),
  competitorHandles: z.array(z.string()).default([]),
  autonomousModeEnabled: z.boolean().default(true),
  googleSheetId: z.string().optional(),
  bookingCalendarUrl: z.string().url().optional(),
});

export async function handleRegisterTenant(req: Request, res: Response): Promise<void> {
  const parsed = RegisterTenantSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation Error', details: parsed.error.format() }); return; }
  const { companyName, email, brandVoice, niche, targetAudience, competitorHandles, autonomousModeEnabled, googleSheetId, bookingCalendarUrl } = parsed.data;
  const sql = `
    INSERT INTO tenants
    (company_name, brand_voice, is_internal, current_plan, notification_email, niche, target_audience, competitor_handles, autonomous_mode_enabled, google_sheet_id, booking_calendar_url)
    VALUES ($1, $2, false, 'FREE_STARTER', $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, company_name, notification_email, niche, target_audience, competitor_handles, autonomous_mode_enabled, google_sheet_id, is_active, created_at;
  `;
  try {
    const dbRes = await pool.query(sql, [companyName, brandVoice, email, niche, targetAudience, JSON.stringify(competitorHandles), autonomousModeEnabled, googleSheetId || null, bookingCalendarUrl || null]);
    const tenant = dbRes.rows[0];
    logger.info({ tenantId: tenant.id }, 'Tenant registered');
    res.status(201).json({ success: true, tenant });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to register tenant');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleListTenants(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const isSuper = req.user.role === 'SUPERADMIN';
  try {
    if (isSuper) {
      const dbRes = await pool.query(`SELECT id, company_name, niche, target_audience, competitor_handles, autonomous_mode_enabled, is_active, created_at FROM tenants ORDER BY created_at DESC;`);
      res.status(200).json({ success: true, count: dbRes.rows.length, tenants: dbRes.rows });
      return;
    }
    const tenantId = req.user.tenantId || req.tenantId;
    if (!tenantId) { res.status(403).json({ error: 'Tenant context required' }); return; }
    const dbRes = await executeTenantQuery(tenantId, `SELECT id, company_name, niche, target_audience, competitor_handles, autonomous_mode_enabled, is_active, created_at FROM tenants WHERE id = $1;`, [tenantId]);
    res.status(200).json({ success: true, count: dbRes.rows.length, tenants: dbRes.rows });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to list tenants');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleGetTenantById(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const isSuper = req.user.role === 'SUPERADMIN';
  const targetId = isSuper ? String(req.params.id || req.user.tenantId || '') : String(req.user.tenantId || req.tenantId || '');
  if (!targetId) { res.status(403).json({ error: 'Tenant context required' }); return; }
  try {
    const dbRes = await executeTenantQuery(targetId, `SELECT id, company_name, brand_voice, niche, target_audience, competitor_handles, autonomous_mode_enabled, google_sheet_id, booking_calendar_url, is_active, created_at FROM tenants WHERE id = $1;`, [targetId]);
    if (!dbRes.rows[0]) { res.status(404).json({ error: 'Tenant not found' }); return; }
    res.status(200).json({ success: true, tenant: dbRes.rows[0] });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to get tenant');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleUpdateTenant(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const isSuper = req.user.role === 'SUPERADMIN';
  const targetId = isSuper ? String(req.params.id || req.user.tenantId || '') : String(req.user.tenantId || req.tenantId || '');
  if (!targetId) { res.status(403).json({ error: 'Tenant context required' }); return; }
  const { companyName, brandVoice, niche, targetAudience, competitorHandles, autonomousModeEnabled, googleSheetId, bookingCalendarUrl, notificationEmail, isActive } = req.body || {};
  const sql = `
    UPDATE tenants
    SET company_name = COALESCE($2, company_name),
        brand_voice = COALESCE($3, brand_voice),
        niche = COALESCE($4, niche),
        target_audience = COALESCE($5, target_audience),
        competitor_handles = COALESCE($6, competitor_handles),
        autonomous_mode_enabled = COALESCE($7, autonomous_mode_enabled),
        google_sheet_id = COALESCE($8, google_sheet_id),
        booking_calendar_url = COALESCE($9, booking_calendar_url),
        notification_email = COALESCE($10, notification_email),
        is_active = COALESCE($11, is_active)
    WHERE id = $1
    RETURNING id, company_name, niche, target_audience, competitor_handles, autonomous_mode_enabled, is_active;
  `;
  try {
    const dbRes = await executeTenantQuery(targetId, sql, [targetId, companyName || null, brandVoice || null, niche || null, targetAudience || null, competitorHandles ? JSON.stringify(competitorHandles) : null, typeof autonomousModeEnabled === 'boolean' ? autonomousModeEnabled : null, googleSheetId || null, bookingCalendarUrl || null, notificationEmail || null, typeof isActive === 'boolean' ? isActive : null]);
    await logAiOperation({ tenantId: targetId, actorUserId: req.user.userId, actorRole: req.user.role, intent: 'update_tenant', proposedTool: 'UPDATE_TENANT', proposedParams: { targetId }, decision: 'ALLOW', executedTool: 'update_tenant', resultStatus: 'SUCCESS' });
    res.status(200).json({ success: true, tenant: dbRes.rows[0] });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to update tenant');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
