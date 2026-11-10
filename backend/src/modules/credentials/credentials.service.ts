import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { encryptData, decryptData } from '../../core/security/encryption.security';
import { logger } from '../../core/config/logger.config';

const ALLOWED_PLATFORMS = new Set(['instagram', 'facebook', 'whatsapp', 'linkedin', 'twitter']);

export async function saveTenantCredential(
  tenantId: string,
  platform: string,
  accountId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date | string
): Promise<any> {
  const p = String(platform || '').toLowerCase();
  if (!ALLOWED_PLATFORMS.has(p)) throw new Error('Platform not allowed');
  if (!tenantId || !accountId || !accessToken) throw new Error('Missing required fields');
  const encryptedAccess = encryptData(accessToken);
  const encryptedRefresh = refreshToken ? encryptData(refreshToken) : null;
  const tokenExpires = expiresAt ? new Date(expiresAt) : null;
  const sql = `
    INSERT INTO tenant_credentials (tenant_id, platform, account_id, access_token, refresh_token, token_expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tenant_id, platform)
    DO UPDATE SET account_id = EXCLUDED.account_id, access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, token_expires_at = EXCLUDED.token_expires_at
    RETURNING id, platform, account_id, token_expires_at, created_at;
  `;
  const dbRes = await executeTenantQuery(tenantId, sql, [tenantId, p, String(accountId).slice(0, 200), encryptedAccess, encryptedRefresh, tokenExpires]);
  logger.info({ tenantId, platform: p }, 'Credential saved');
  return dbRes.rows[0];
}

/** System-level lookup used by webhook resolution; parameterized and bounded. */
export async function findTenantByPlatformAccount(platform: string, accountId: string): Promise<string | null> {
  const p = String(platform || '').toLowerCase();
  const a = String(accountId || '');
  if (!ALLOWED_PLATFORMS.has(p) || !a) return null;
  try {
    const res = await pool.query(`SELECT tenant_id FROM tenant_credentials WHERE platform = $1 AND account_id = $2 LIMIT 1;`, [p, a.slice(0, 200)]);
    return res.rows[0]?.tenant_id || null;
  } catch (err: any) {
    logger.error({ err: err.message, platform: p }, 'Failed to resolve tenant by platform account');
    return null;
  }
}

export async function getDecryptedTenantCredential(tenantId: string, platform: string): Promise<any | null> {
  const p = String(platform || '').toLowerCase();
  try {
    const res = await executeTenantQuery(tenantId, `SELECT id, platform, account_id, access_token, refresh_token, token_expires_at FROM tenant_credentials WHERE tenant_id = $1 AND platform = $2 LIMIT 1;`, [tenantId, p]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id, platform: row.platform, accountId: row.account_id,
      accessToken: decryptData(row.access_token),
      refreshToken: row.refresh_token ? decryptData(row.refresh_token) : null,
      tokenExpiresAt: row.token_expires_at,
    };
  } catch (err: any) {
    logger.error({ err: err.message, tenantId, platform: p }, 'Failed to fetch credentials');
    return null;
  }
}

export async function listTenantCredentials(tenantId: string): Promise<any[]> {
  const res = await executeTenantQuery(tenantId, `SELECT id, platform, account_id, token_expires_at, created_at FROM tenant_credentials WHERE tenant_id = $1;`, [tenantId]);
  return res.rows;
}

export async function deleteTenantCredential(tenantId: string, platform: string): Promise<void> {
  const p = String(platform || '').toLowerCase();
  await executeTenantQuery(tenantId, `DELETE FROM tenant_credentials WHERE tenant_id = $1 AND platform = $2;`, [tenantId, p]);
}
