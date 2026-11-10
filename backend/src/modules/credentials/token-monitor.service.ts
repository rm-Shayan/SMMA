import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';
import { sendLeadAlertEmail } from '../integrations/smtp-email.service';
import { logOutboundCall } from '../agents/agent.audit';

export interface ExpiringCredential {
  id: string;
  tenant_id: string;
  tenant_name: string;
  contact_email: string;
  platform: string;
  account_id: string;
  token_expires_at: Date;
  days_remaining: number;
}

export async function checkExpiringCredentials(daysThreshold: number = 7): Promise<ExpiringCredential[]> {
  const sql = `
    SELECT c.id, c.tenant_id, t.company_name as tenant_name, t.notification_email as contact_email, c.platform, c.account_id, c.token_expires_at,
      ROUND(EXTRACT(EPOCH FROM (c.token_expires_at - NOW())) / 86400) as days_remaining
    FROM tenant_credentials c
    JOIN tenants t ON t.id = c.tenant_id
    WHERE c.token_expires_at IS NOT NULL
      AND c.token_expires_at <= NOW() + ($1 || ' days')::interval
      AND c.token_expires_at > NOW()
    ORDER BY c.token_expires_at ASC;
  `;
  try {
    const res = await pool.query(sql, [Math.max(1, Math.min(30, Number(daysThreshold) || 7))]); // system job
    return res.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to query expiring credentials');
    return [];
  }
}

export async function runTokenHealthAudit(): Promise<void> {
  const expiring = await checkExpiringCredentials(7);
  if (!expiring.length) return;
  logger.warn({ count: expiring.length }, 'Expiring social tokens detected');
  for (const item of expiring) {
    if (!item.contact_email) continue;
    const started = Date.now();
    try {
      await sendLeadAlertEmail({
        toEmail: item.contact_email, companyName: item.tenant_name,
        leadName: `Security Alert: ${String(item.platform).toUpperCase()}`, leadPhone: 'N/A', leadEmail: item.contact_email,
        channel: item.platform, interest: `OAuth token expires in ${item.days_remaining} day(s).`, leadScore: 100, googleSheetUrl: 'https://agency.portal/settings/integrations',
      });
      await logOutboundCall({ tenantId: item.tenant_id, toolName: 'token_expiry_alert_email', method: 'POST', destinationHost: 'smtp', destinationPath: '/send', decision: 'ALLOW', decisionReason: 'System token health alert to tenant contact', status: 'SUCCESS', latencyMs: Date.now() - started });
    } catch (e: any) {
      await logOutboundCall({ tenantId: item.tenant_id, toolName: 'token_expiry_alert_email', method: 'POST', destinationHost: 'smtp', destinationPath: '/send', decision: 'ALLOW', decisionReason: 'System token health alert to tenant contact', status: 'FAILED', latencyMs: Date.now() - started, error: e.message });
    }
  }
}
