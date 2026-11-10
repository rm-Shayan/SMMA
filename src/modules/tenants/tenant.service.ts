import { pool } from '../../core/database/pool.database';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/config/logger.config';

export interface TenantIntegrations {
  tenantId: string;
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
    const res = await pool.query(
      `SELECT google_sheet_id, booking_calendar_url, calendar_id, notification_email FROM tenants WHERE id = $1 LIMIT 1`,
      [tenantId]
    );

    const row = res.rows[0];
    const sheetId = row?.google_sheet_id || fallbackSheet;
    const bookingUrl = row?.booking_calendar_url || fallbackBooking;
    const calendarId = row?.calendar_id || fallbackCalendarId;
    const notificationEmail = row?.notification_email || fallbackEmail;
    const isUsingFallback = !row?.google_sheet_id || !row?.booking_calendar_url;

    return {
      tenantId,
      googleSheetId: sheetId,
      bookingCalendarUrl: bookingUrl,
      calendarId,
      notificationEmail,
      isUsingFallback,
    };
  } catch (err: any) {
    logger.warn({ err: err.message, tenantId }, 'Tenant integrations lookup failed, using fallback');
    return {
      tenantId,
      googleSheetId: fallbackSheet,
      bookingCalendarUrl: fallbackBooking,
      calendarId: fallbackCalendarId,
      notificationEmail: fallbackEmail,
      isUsingFallback: true,
    };
  }
}
