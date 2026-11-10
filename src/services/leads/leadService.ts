import { pool } from '../../db/pool';
import { logger } from '../../config/logger';
import { syncLeadToGoogleSheets } from './googleSheetsService';
import { appendLeadToGoogleSheet } from '../google/googleSheetsService';
import { getTenantIntegrations } from '../tenant/tenantSettingsService';
import { sendLeadAlertEmail } from '../email/smtpService';

export interface CapturedLeadData {
  tenantId: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  channel: string;
  inquiryInterest?: string;
  leadScore?: number;
  crmStage?: string;
}

/**
 * Saves a qualified lead captured by Agent #6 or Agent #9 into the database.
 */
export async function saveCapturedLead(data: CapturedLeadData): Promise<string | null> {
  // If there's no contact details at all, skip saving
  if (!data.name && !data.phone && !data.email) {
    return null;
  }

  const sql = `
    INSERT INTO client_leads 
    (tenant_id, name, phone, email, channel, inquiry_interest, lead_score, crm_stage)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;
  `;

  try {
    const res = await pool.query(sql, [
      data.tenantId,
      data.name || 'Anonymous Prospect',
      data.phone || null,
      data.email || null,
      data.channel,
      data.inquiryInterest || 'General Inquiry',
      data.leadScore || 60,
      data.crmStage || 'NEW_LEAD',
    ]);

    const leadId = res.rows[0]?.id;
    logger.info({ leadId, name: data.name, phone: data.phone }, '🎯 New Lead successfully captured in database!');

    // Asynchronously push to tenant's Google Sheet & dispatch Email Alert
    syncLeadToGoogleSheets(data).catch(() => {});
    getTenantIntegrations(data.tenantId)
      .then((integrations) => {
        appendLeadToGoogleSheet(data, integrations.googleSheetId).catch(() => {});
        const sheetUrl = integrations.googleSheetId
          ? `https://docs.google.com/spreadsheets/d/${integrations.googleSheetId}/edit`
          : 'https://docs.google.com';
        if (integrations.notificationEmail) {
          sendLeadAlertEmail({
            toEmail: integrations.notificationEmail,
            companyName: 'Client Account',
            leadName: data.name || 'Anonymous Prospect',
            leadPhone: data.phone || 'N/A',
            leadEmail: data.email || 'N/A',
            channel: data.channel,
            interest: data.inquiryInterest || 'General Inquiry',
            leadScore: data.leadScore || 60,
            googleSheetUrl: sheetUrl,
          }).catch(() => {});
        }
      })
      .catch(() => {});

    return leadId;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to save captured lead');
    return null;
  }
}

/**
 * Retrieves all captured leads for a tenant (used by Boss / CRM Table)
 */
export async function getTenantLeads(tenantId: string, limit = 50): Promise<any[]> {
  const sql = `
    SELECT id, name, phone, email, channel, inquiry_interest, lead_score, crm_stage, created_at
    FROM client_leads
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  try {
    const res = await pool.query(sql, [tenantId, limit]);
    return res.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to fetch tenant leads');
    return [];
  }
}

