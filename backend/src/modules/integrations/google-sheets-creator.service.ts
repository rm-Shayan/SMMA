import { getGoogleAccessToken } from './google-auth.service';
import { logger } from '../../core/config/logger.config';
import { env } from '../../core/config/env.config';

export interface DynamicSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetTitle: string;
}

export async function createGoogleSpreadsheet(
  title: string,
  headers: string[],
  initialRows: (string | number)[][] = []
): Promise<DynamicSpreadsheetResult | null> {
  const token = await getGoogleAccessToken();
  if (!token) {
    logger.error('No Google Access Token available to create spreadsheet');
    return null;
  }

  const payload = {
    properties: { title },
    sheets: [
      {
        properties: { title: 'Sheet1' },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map((h) => ({ userEnteredValue: { stringValue: h } })),
              },
              ...initialRows.map((row) => ({
                values: row.map((val) => ({
                  userEnteredValue: typeof val === 'number' ? { numberValue: val } : { stringValue: String(val) },
                })),
              })),
            ],
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'Failed to create Google Spreadsheet');
      return null;
    }

    const data: any = await res.json();
    logger.info({ spreadsheetId: data.spreadsheetId, title }, '📊 Google Spreadsheet dynamically created!');

    return {
      spreadsheetId: data.spreadsheetId,
      spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
      title,
      sheetTitle: 'Sheet1',
    };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Google Sheets Creation API failed');
    return null;
  }
}

