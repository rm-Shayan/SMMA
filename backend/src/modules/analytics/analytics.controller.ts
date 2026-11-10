import { Request, Response } from 'express';
import { getTenantAnalytics } from './analytics.service';

export async function handleGetAnalytics(req: Request, res: Response): Promise<void> {
  const rawTenantId = (req.user?.role === 'SUPERADMIN' && req.params.tenantId)
    ? req.params.tenantId
    : req.tenantId;
  const targetTenantId = String(Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId || '');

  if (!targetTenantId) {
    res.status(400).json({ error: 'Tenant ID required' });
    return;
  }

  const summary = await getTenantAnalytics(targetTenantId);
  res.status(200).json({ success: true, analytics: summary });
}
