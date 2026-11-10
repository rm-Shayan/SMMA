import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../core/database/pool.database';
import { saveTenantCredential } from './credentials.service';
import { logger } from '../../core/config/logger.config';

const ConnectPlatformSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'whatsapp', 'linkedin', 'twitter']),
  accountId: z.string().min(1),
  accessToken: z.string().min(5),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().or(z.string()).optional(),
});

export async function handleSaveCredentials(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
    return;
  }

  const parsed = ConnectPlatformSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }

  const { platform, accountId, accessToken, refreshToken, expiresAt } = parsed.data;

  try {
    const credential = await saveTenantCredential(tenantId, platform, accountId, accessToken, refreshToken, expiresAt);
    res.status(200).json({ success: true, credential });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to save social credentials');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleListCredentials(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const sql = `SELECT id, platform, account_id, token_expires_at, created_at FROM tenant_credentials WHERE tenant_id = $1;`;
  try {
    const dbRes = await pool.query(sql, [tenantId]);
    res.status(200).json({ success: true, connectedChannels: dbRes.rows });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to list credentials');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleDeleteCredential(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const platform = req.params.platform;
  const sql = `DELETE FROM tenant_credentials WHERE tenant_id = $1 AND platform = $2;`;
  try {
    await pool.query(sql, [tenantId, platform]);
    res.status(200).json({ success: true, message: `Disconnected ${platform}` });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to delete credential');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
