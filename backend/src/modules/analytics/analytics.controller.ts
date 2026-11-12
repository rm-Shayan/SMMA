import { Request, Response } from 'express';
import { getTenantAnalytics, getSystemWideAnalytics } from './analytics.service';
import { logAiOperation } from '../agents/agent.audit';

export async function handleGetAnalytics(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const isSuper = req.user.role === 'SUPERADMIN';
  const rawTenantId = isSuper
    ? (req.params.tenantId || req.query.tenantId || req.user.tenantId)
    : (req.user.tenantId || req.tenantId);
  const targetTenantId = String(Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId || '');

  let summary;
  if (!targetTenantId) {
    if (isSuper) {
      summary = await getSystemWideAnalytics();
    } else {
      res.status(403).json({ error: 'Tenant context required' });
      return;
    }
  } else {
    summary = await getTenantAnalytics(targetTenantId);
  }

  await logAiOperation({
    tenantId: targetTenantId || 'system-wide',
    actorUserId: req.user.userId,
    actorRole: req.user.role,
    intent: 'view_analytics',
    proposedTool: 'QUERY_DATA',
    proposedParams: { entity: 'ANALYTICS' },
    decision: 'ALLOW',
    executedTool: 'get_tenant_analytics',
    resultStatus: 'SUCCESS',
  });

  res.status(200).json({ success: true, analytics: summary });
}
