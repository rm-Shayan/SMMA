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

interface QueuedLead {
  row: (string | number)[];
  spreadsheetId: string;
  resolve: (ok: boolean) => void;
}

const leadBatchQueue: QueuedLead[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushLeadBatch(): Promise<void> {
  flushTimeout = null;
  if (leadBatchQueue.length === 0) return;

  const currentBatch = leadBatchQueue.splice(0, leadBatchQueue.length);
  const bySpreadsheet = new Map<string, QueuedLead[]>();

  for (const item of currentBatch) {
    const list = bySpreadsheet.get(item.spreadsheetId) || [];
    list.push(item);
    bySpreadsheet.set(item.spreadsheetId, list);
  }

  const token = await getGoogleAccessToken();
  if (!token) {
    currentBatch.forEach((item) => item.resolve(false));
    return;
  }

  for (const [spreadsheetId, items] of bySpreadsheet.entries()) {
    const rows = items.map((i) => i.row);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:H:append?valueInputOption=USER_ENTERED`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      });

      if (!res.ok) {
        const err = await res.text();
        logger.error({ status: res.status, err, count: rows.length }, 'Failed to batch append to Google Sheet');
        items.forEach((i) => i.resolve(false));
        continue;
      }

      logger.info({ count: rows.length, spreadsheetId }, '📊 Direct Google Sheets API: Batched rows added successfully!');
      items.forEach((i) => i.resolve(true));
    } catch (err: any) {
      logger.error({ err: err.message, count: rows.length }, 'Google Sheets API batch append failed');
      items.forEach((i) => i.resolve(false));
    }
  }
}

export async function appendLeadToGoogleSheet(data: LeadSheetRow, overrideSpreadsheetId?: string): Promise<boolean> {
  const spreadsheetId = overrideSpreadsheetId || env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    logger.debug('No Google Spreadsheet ID available. Skipping direct Google Sheet sync.');
    return false;
  }

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

  return new Promise<boolean>((resolve) => {
    leadBatchQueue.push({ row, spreadsheetId, resolve });

    if (leadBatchQueue.length >= 10) {
      if (flushTimeout) clearTimeout(flushTimeout);
      flushLeadBatch();
    } else if (!flushTimeout) {
      flushTimeout = setTimeout(flushLeadBatch, 1500);
    }
  });
}
