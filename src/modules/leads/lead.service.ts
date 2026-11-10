import { pool } from '../../core/database/pool.database';
import { logger } from '../../core/config/logger.config';
import { appendLeadToGoogleSheet } from '../integrations/google-sheets.service';
import { getTenantIntegrations } from '../tenants/tenant.service';
import { sendLeadAlertEmail } from '../integrations/smtp-email.service';

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

export async function saveCapturedLead(data: CapturedLeadData): Promise<string | null> {
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
