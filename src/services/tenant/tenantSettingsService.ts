import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface TenantIntegrations {
  tenantId: string;
  googleSheetId: string;
  bookingCalendarUrl: string;
  calendarId: string;
  notificationEmail: string;
  isUsingFallback: boolean;
}

/**
 * Retrieves integration settings for a tenant with agency master fallback.
 * Ensures zero leads or bookings are missed even if the client hasn't added theirs.
 */
export async function getTenantIntegrations(tenantId: string): Promise<TenantIntegrations> {
  const fallbackSheet = process.env.GOOGLE_SPREADSHEET_ID || env.GOOGLE_SHEETS_WEBHOOK_URL || '';
  const fallbackBooking = process.env.CALENDAR_BOOKING_URL || env.CALENDAR_BOOKING_URL || '';
  const fallbackCalendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    const res = await pool.query(
      `SELECT google_sheet_id, booking_calendar_url, calendar_id FROM tenants WHERE id = $1 LIMIT 1`,
      [tenantId]
    );

    const row = res.rows[0];
    const sheetId = row?.google_sheet_id || fallbackSheet;
    const bookingUrl = row?.booking_calendar_url || fallbackBooking;
    const calendarId = row?.calendar_id || fallbackCalendarId;
    const notificationEmail = row?.notification_email || process.env.SMTP_MAIL || '';
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
    logger.warn({ err: err.message, tenantId }, 'Tenant integrations lookup failed, using agency fallback');
    return {
      tenantId,
      googleSheetId: fallbackSheet,
      bookingCalendarUrl: fallbackBooking,
      calendarId: fallbackCalendarId,
      notificationEmail: process.env.SMTP_MAIL || '',
      isUsingFallback: true,
    };
  }
}

/**
 * Updates a tenant's custom Google Sheet and Booking Calendar
 */
export async function updateTenantIntegrations(
  tenantId: string,
  settings: { googleSheetId?: string; bookingCalendarUrl?: string; calendarId?: string }
): Promise<boolean> {
  const sql = `
    UPDATE tenants
    SET google_sheet_id = COALESCE($2, google_sheet_id),
        booking_calendar_url = COALESCE($3, booking_calendar_url),
        calendar_id = COALESCE($4, calendar_id)
    WHERE id = $1;
  `;
  try {
    await pool.query(sql, [tenantId, settings.googleSheetId, settings.bookingCalendarUrl, settings.calendarId]);
    logger.info({ tenantId }, 'Tenant integration settings updated');
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to update tenant integrations');
    return false;
  }
}

