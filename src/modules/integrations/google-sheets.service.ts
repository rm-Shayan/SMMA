import { getGoogleAccessToken } from './google-auth.service';
import { logger } from '../../core/config/logger.config';
import { env } from '../../core/config/env.config';

export interface LeadSheetRow {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  channel: string;
  inquiryInterest?: string;
  leadScore?: number;
  crmStage?: string;
}

export async function appendLeadToGoogleSheet(data: LeadSheetRow, overrideSpreadsheetId?: string): Promise<boolean> {
  const spreadsheetId = overrideSpreadsheetId || env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    logger.debug('No Google Spreadsheet ID available. Skipping direct Google Sheet sync.');
    return false;
  }

  const token = await getGoogleAccessToken();
  if (!token) return false;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:H:append?valueInputOption=USER_ENTERED`;
  const row = [
    new Date().toISOString(),
    data.name || 'Anonymous Prospect',
    data.phone || 'N/A',
    data.email || 'N/A',
    data.channel,
    data.inquiryInterest || 'General Inquiry',
    data.leadScore || 60,
    data.crmStage || 'NEW_LEAD',
  ];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'Failed to append row to Google Sheet');
      return false;
    }

    logger.info({ name: data.name, phone: data.phone }, '📊 Direct Google Sheets API: Row added successfully!');
    return true;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Google Sheets API append failed');
    return false;
  }
}
