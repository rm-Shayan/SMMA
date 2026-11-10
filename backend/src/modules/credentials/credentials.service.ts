import { pool } from '../../core/database/pool.database';
import { encryptData, decryptData } from '../../core/security/encryption.security';
import { logger } from '../../core/config/logger.config';

export async function saveTenantCredential(
  tenantId: string,
  platform: string,
  accountId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date | string
): Promise<any> {
  const encryptedAccess = encryptData(accessToken);
  const encryptedRefresh = refreshToken ? encryptData(refreshToken) : null;
  const tokenExpires = expiresAt ? new Date(expiresAt) : null;

  const sql = `
    INSERT INTO tenant_credentials (tenant_id, platform, account_id, access_token, refresh_token, token_expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tenant_id, platform) 
    DO UPDATE SET account_id = EXCLUDED.account_id, 
                  access_token = EXCLUDED.access_token, 
                  refresh_token = EXCLUDED.refresh_token,
                  token_expires_at = EXCLUDED.token_expires_at
    RETURNING id, platform, account_id, token_expires_at, created_at;
  `;

  const dbRes = await pool.query(sql, [tenantId, platform, accountId, encryptedAccess, encryptedRefresh, tokenExpires]);
  logger.info({ tenantId, platform }, '🔒 Social media credential securely encrypted and saved');
  return dbRes.rows[0];
}

export async function findTenantByPlatformAccount(platform: string, accountId: string): Promise<string | null> {
  if (!platform || !accountId) return null;
  try {
    const res = await pool.query(
      `SELECT tenant_id FROM tenant_credentials WHERE platform = $1 AND account_id = $2 LIMIT 1;`,
      [platform, accountId]
    );
    return res.rows[0]?.tenant_id || null;
  } catch (err: any) {
    logger.error({ err: err.message, platform }, 'Failed to resolve tenant by platform account');
    return null;
  }
}

export async function getDecryptedTenantCredential(tenantId: string, platform: string): Promise<any | null> {
  const sql = `SELECT id, platform, account_id, access_token, refresh_token, token_expires_at FROM tenant_credentials WHERE tenant_id = $1 AND platform = $2 LIMIT 1;`;
  try {
    const res = await pool.query(sql, [tenantId, platform]);
    const row = res.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      platform: row.platform,
      accountId: row.account_id,
      accessToken: decryptData(row.access_token),
      refreshToken: row.refresh_token ? decryptData(row.refresh_token) : null,
      tokenExpiresAt: row.token_expires_at,
    };
  } catch (err: any) {
    logger.error({ err: err.message, tenantId, platform }, 'Failed to fetch credentials');
    return null;
  }
}
