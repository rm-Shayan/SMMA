import { Request, Response } from 'express';
import { z } from 'zod';
import { saveTenantCredential, listTenantCredentials, deleteTenantCredential } from './credentials.service';
import { logger } from '../../core/config/logger.config';
import { logAiOperation } from '../agents/agent.audit';

const ConnectPlatformSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'whatsapp', 'linkedin', 'twitter']),
  accountId: z.string().min(1),
  accessToken: z.string().min(5),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().or(z.string()).optional(),
});

function resolveTenant(req: Request): string | null {
  if (req.user?.role === 'SUPERADMIN') return (req.body?.tenantId || req.tenantId || req.user.tenantId || null) as string | null;
  return (req.user?.tenantId || req.tenantId || null) as string | null;
}

export async function handleSaveCredentials(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTenant(req);
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Tenant context required' }); return; }
  const parsed = ConnectPlatformSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation Error', details: parsed.error.format() }); return; }
  const { platform, accountId, accessToken, refreshToken, expiresAt } = parsed.data;
  try {
    const credential = await saveTenantCredential(tenantId, platform, accountId, accessToken, refreshToken, expiresAt);
    await logAiOperation({ tenantId, actorUserId: req.user.userId, actorRole: req.user.role, intent: 'save_credential', proposedTool: 'UPSERT_CREDENTIAL', proposedParams: { platform, accountId }, decision: 'ALLOW', executedTool: 'save_tenant_credential', resultStatus: 'SUCCESS' });
    res.status(200).json({ success: true, credential });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to save social credentials');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleListCredentials(req: Request, res: Response): Promise<void> {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (typeof req.query.tenantId === 'string' ? req.query.tenantId : req.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Tenant context required' }); return; }
  try {
    const rows = await listTenantCredentials(tenantId as string);
    res.status(200).json({ success: true, connectedChannels: rows });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to list credentials');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleDeleteCredential(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTenant(req);
  const platform = String(req.params.platform || '');
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Tenant context required' }); return; }
  try {
    await deleteTenantCredential(tenantId, platform);
    await logAiOperation({ tenantId, actorUserId: req.user.userId, actorRole: req.user.role, intent: 'delete_credential', proposedTool: 'DELETE_CREDENTIAL', proposedParams: { platform }, decision: 'ALLOW', executedTool: 'delete_tenant_credential', resultStatus: 'SUCCESS' });
    res.status(200).json({ success: true, message: `Disconnected ${platform}` });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to delete credential');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
