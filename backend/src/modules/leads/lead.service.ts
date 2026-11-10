import { pool } from '../../core/database/pool.database';
import { logger } from '../../core/config/logger.config';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
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
  if (!data.tenantId) return null;
  if (!data.name && !data.phone && !data.email) {
    return null;
  }

  const name = (data.name || 'Anonymous Prospect').slice(0, 200);
  const phone = data.phone ? String(data.phone).slice(0, 50) : null;
  const email = data.email ? String(data.email).slice(0, 320) : null;
  const leadScore = Math.max(0, Math.min(100, Number(data.leadScore) || 60));
  const crmStage = (data.crmStage || 'NEW_LEAD').slice(0, 50);
  const interest = (data.inquiryInterest || 'General Inquiry').slice(0, 1000);

  try {
    let leadId: string | null = null;
    let isNewLead = true;

    if (phone || email) {
      const existing = await executeTenantQuery(
        data.tenantId,
        `SELECT id FROM client_leads
         WHERE tenant_id = $1
           AND (($2::text IS NOT NULL AND phone = $2) OR ($3::text IS NOT NULL AND email = $3))
         ORDER BY created_at DESC LIMIT 1;`,
        [data.tenantId, phone, email]
      );

      const existingId = existing.rows[0]?.id;
      if (existingId) {
        const updated = await executeTenantQuery(
          data.tenantId,
          `UPDATE client_leads
           SET name = COALESCE($2, name),
               phone = COALESCE($3, phone),
               email = COALESCE($4, email),
               channel = $5,
               inquiry_interest = COALESCE($6, inquiry_interest),
               lead_score = GREATEST(lead_score, $7),
               crm_stage = COALESCE($8, crm_stage)
           WHERE id = $1 AND tenant_id = $9
           RETURNING id;`,
          [existingId, name, phone, email, data.channel, interest, leadScore, crmStage, data.tenantId]
        );
        leadId = updated.rows[0]?.id || existingId;
        isNewLead = false;
        logger.info({ leadId }, 'Existing lead updated (deduplicated)');
      }
    }

    if (!leadId) {
      const res = await executeTenantQuery(
        data.tenantId,
        `INSERT INTO client_leads
         (tenant_id, name, phone, email, channel, inquiry_interest, lead_score, crm_stage)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id;`,
        [data.tenantId, name, phone, email, data.channel, interest, leadScore, crmStage]
      );
      leadId = res.rows[0]?.id || null;
      logger.info({ leadId }, 'New lead captured in database');
    }

    if (!isNewLead || !leadId) {
      return leadId;
    }

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
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const sql = `
    SELECT id, name, phone, email, channel, inquiry_interest, lead_score, crm_stage, created_at
    FROM client_leads
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  try {
    const res = await executeTenantQuery(tenantId, sql, [tenantId, safeLimit]);
    return res.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to fetch tenant leads');
    return [];
  }
}
