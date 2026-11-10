import { pool } from '../../core/database/pool.database';
import { logger } from '../../core/config/logger.config';
import { sendLeadAlertEmail } from '../integrations/smtp-email.service';

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
    SELECT 
      c.id, 
      c.tenant_id, 
      t.company_name as tenant_name, 
      t.notification_email as contact_email, 
      c.platform, 
      c.account_id, 
      c.token_expires_at,
      ROUND(EXTRACT(EPOCH FROM (c.token_expires_at - NOW())) / 86400) as days_remaining
    FROM tenant_credentials c
    JOIN tenants t ON t.id = c.tenant_id
    WHERE c.token_expires_at IS NOT NULL
      AND c.token_expires_at <= NOW() + ($1 || ' days')::interval
      AND c.token_expires_at > NOW()
    ORDER BY c.token_expires_at ASC;
  `;

  try {
    const res = await pool.query(sql, [daysThreshold]);
    return res.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to query expiring credentials');
    return [];
  }
}

export async function runTokenHealthAudit(): Promise<void> {
  const expiring = await checkExpiringCredentials(7);
  if (expiring.length === 0) return;

  logger.warn({ count: expiring.length }, '⚠️ Found social media access tokens approaching expiration within 7 days!');

  for (const item of expiring) {
    logger.warn(
      { tenant: item.tenant_name, platform: item.platform, daysLeft: item.days_remaining },
      `Token for platform ${item.platform} will expire in ${item.days_remaining} day(s). Action required.`
    );

    if (item.contact_email) {
      await sendLeadAlertEmail({
        toEmail: item.contact_email,
        companyName: item.tenant_name,
        leadName: `Security Alert: ${item.platform.toUpperCase()}`,
        leadPhone: 'N/A',
        leadEmail: item.contact_email,
        channel: item.platform,
        interest: `OAuth Access Token expires in ${item.days_remaining} day(s). Reconnection required.`,
        leadScore: 100,
        googleSheetUrl: 'https://agency.portal/settings/integrations',
      }).catch((e) => logger.debug({ err: e.message }, 'Silent email alert skip'));
    }
  }
}
