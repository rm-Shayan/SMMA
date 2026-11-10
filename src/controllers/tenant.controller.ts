import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { logger } from '../config/logger';

const RegisterTenantSchema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  brandVoice: z.string().default('Professional, authoritative, high-conversion'),
  googleSheetId: z.string().optional(),
  bookingCalendarUrl: z.string().url().optional(),
});

export async function handleRegisterTenant(req: Request, res: Response): Promise<void> {
  const parsed = RegisterTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }
  const { companyName, email, brandVoice, googleSheetId, bookingCalendarUrl } = parsed.data;
  const sql = `
    INSERT INTO tenants 
    (company_name, brand_voice, is_internal, current_plan, notification_email, google_sheet_id, booking_calendar_url)
    VALUES ($1, $2, false, 'FREE_STARTER', $3, $4, $5)
    RETURNING id, company_name, notification_email, google_sheet_id, booking_calendar_url, is_active, created_at;
  `;
  try {
    const dbRes = await pool.query(sql, [companyName, brandVoice, email, googleSheetId || null, bookingCalendarUrl || null]);
    const tenant = dbRes.rows[0];
    logger.info({ tenantId: tenant.id, companyName }, '🏢 New Company registered');
    res.status(201).json({ success: true, tenant });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to register tenant');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleListTenants(req: Request, res: Response): Promise<void> {
  const isSuper = req.user?.role === 'SUPERADMIN';
  const sql = isSuper
    ? `SELECT id, company_name, brand_voice, current_plan, notification_email, google_sheet_id, booking_calendar_url, is_active, created_at FROM tenants ORDER BY created_at DESC;`
    : `SELECT id, company_name, brand_voice, current_plan, notification_email, google_sheet_id, booking_calendar_url, is_active, created_at FROM tenants WHERE id = $1;`;
  const params = isSuper ? [] : [req.tenantId];

  try {
    const dbRes = await pool.query(sql, params);
    res.status(200).json({ success: true, count: dbRes.rows.length, tenants: dbRes.rows });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to list tenants');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleGetTenantById(req: Request, res: Response): Promise<void> {
  const targetId = req.params.id || req.tenantId;
  const sql = `SELECT id, company_name, brand_voice, current_plan, notification_email, google_sheet_id, booking_calendar_url, is_active, created_at FROM tenants WHERE id = $1;`;
  try {
    const dbRes = await pool.query(sql, [targetId]);
    if (!dbRes.rows[0]) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    res.status(200).json({ success: true, tenant: dbRes.rows[0] });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to get tenant');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleUpdateTenant(req: Request, res: Response): Promise<void> {
  const targetId = req.params.id || req.tenantId;
  const { companyName, brandVoice, googleSheetId, bookingCalendarUrl, notificationEmail, isActive } = req.body;
  const sql = `
    UPDATE tenants
    SET company_name = COALESCE($2, company_name),
        brand_voice = COALESCE($3, brand_voice),
        google_sheet_id = COALESCE($4, google_sheet_id),
        booking_calendar_url = COALESCE($5, booking_calendar_url),
        notification_email = COALESCE($6, notification_email),
        is_active = COALESCE($7, is_active)
    WHERE id = $1
    RETURNING id, company_name, brand_voice, notification_email, google_sheet_id, booking_calendar_url, is_active;
  `;
  try {
    const dbRes = await pool.query(sql, [targetId, companyName, brandVoice, googleSheetId, bookingCalendarUrl, notificationEmail, isActive]);
    res.status(200).json({ success: true, tenant: dbRes.rows[0] });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to update tenant');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleDeleteTenant(req: Request, res: Response): Promise<void> {
  const targetId = req.params.id;
  try {
    await pool.query(`UPDATE tenants SET is_active = false WHERE id = $1;`, [targetId]);
    res.status(200).json({ success: true, message: 'Tenant deactivated successfully' });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to deactivate tenant');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
