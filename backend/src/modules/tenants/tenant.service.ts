import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/config/logger.config';

export interface TenantIntegrations {
  tenantId: string;
  brandVoice: string;
  niche?: string;
  targetAudience?: string;
  competitorHandles?: string[];
  isActive: boolean;
  googleSheetId: string;
  bookingCalendarUrl: string;
  calendarId: string;
  notificationEmail: string;
  isUsingFallback: boolean;
}

export async function getTenantIntegrations(tenantId: string): Promise<TenantIntegrations> {
  const fallbackSheet = env.GOOGLE_SPREADSHEET_ID || '';
  const fallbackBooking = env.CALENDAR_BOOKING_URL || '';
  const fallbackCalendarId = env.GOOGLE_CALENDAR_ID || 'primary';
  const fallbackEmail = env.SMTP_MAIL || '';

  try {
    const res = await executeTenantQuery(tenantId,
      `SELECT brand_voice, niche, target_audience, competitor_handles, is_active, google_sheet_id, booking_calendar_url, calendar_id, notification_email FROM tenants WHERE id = $1 LIMIT 1`,
      [tenantId]
    );
    const row = res.rows[0];
    return {
      tenantId,
      brandVoice: row?.brand_voice || 'Professional, authoritative, high-conversion',
      niche: row?.niche || 'General Marketing & Sales Automation',
      targetAudience: row?.target_audience || 'Business owners and prospective clients',
      competitorHandles: row?.competitor_handles || [],
      isActive: row ? row.is_active !== false : true,
      googleSheetId: row?.google_sheet_id || fallbackSheet,
      bookingCalendarUrl: row?.booking_calendar_url || fallbackBooking,
      calendarId: row?.calendar_id || fallbackCalendarId,
      notificationEmail: row?.notification_email || fallbackEmail,
      isUsingFallback: !row?.google_sheet_id || !row?.booking_calendar_url,
    };
  } catch (err: any) {
    logger.warn({ err: err.message, tenantId }, 'Tenant integrations lookup failed, using fallback');
    return { tenantId, brandVoice: 'Professional, authoritative, high-conversion', niche: 'General Marketing & Sales Automation', targetAudience: 'Business owners and prospective clients', competitorHandles: [], isActive: true, googleSheetId: fallbackSheet, bookingCalendarUrl: fallbackBooking, calendarId: fallbackCalendarId, notificationEmail: fallbackEmail, isUsingFallback: true };
  }
}
