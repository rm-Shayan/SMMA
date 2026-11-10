import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { CapturedLeadData } from './leadService';

/**
 * Sends captured lead directly into Google Sheets in real-time.
 * Works with Google Apps Script Web App, Zapier, Make, or custom webhook.
 */
export async function syncLeadToGoogleSheets(data: CapturedLeadData): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.debug('GOOGLE_SHEETS_WEBHOOK_URL not configured. Skipping Google Sheets sync.');
    return false;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    tenantId: data.tenantId,
    name: data.name || 'Anonymous Prospect',
    phone: data.phone || 'N/A',
    email: data.email || 'N/A',
    channel: data.channel,
    interest: data.inquiryInterest || 'General Inquiry',
    leadScore: data.leadScore || 60,
    crmStage: data.crmStage || 'NEW_LEAD',
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, 'Failed to sync lead to Google Sheets webhook');
      return false;
    }

    logger.info({ name: data.name, phone: data.phone }, '📊 Lead successfully pushed to Google Sheet!');
    return true;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error dispatching lead to Google Sheets');
    return false;
  }
}
