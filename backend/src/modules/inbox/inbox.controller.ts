import { Request, Response } from 'express';
import { logger } from '../../core/config/logger.config';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { dispatchSocialMessage } from '../social/dispatcher.service';
import { getDecryptedTenantCredential } from '../credentials/credentials.service';
import { logAiOperation } from '../agents/agent.audit';

function resolveTenant(req: Request): string | null {
  if (req.user?.role === 'SUPERADMIN') return (typeof req.query.tenantId === 'string' ? req.query.tenantId : req.body?.tenantId || req.tenantId || req.user.tenantId || null) as string | null;
  return (req.user?.tenantId || req.tenantId || null) as string | null;
}

export async function handleListConversations(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTenant(req);
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' }); return; }
  const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
  const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 100);
  const sql = platform
    ? `SELECT id, platform, sender_id, incoming_text, intent_category, agent_response, is_escalated, created_at FROM tenant_conversations WHERE tenant_id = $1 AND platform = $2 ORDER BY created_at DESC LIMIT $3;`
    : `SELECT id, platform, sender_id, incoming_text, intent_category, agent_response, is_escalated, created_at FROM tenant_conversations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const params = platform ? [tenantId, platform, limit] : [tenantId, limit];
  try {
    const dbRes = await executeTenantQuery(tenantId, sql, params);
    res.status(200).json({ success: true, count: dbRes.rows.length, conversations: dbRes.rows });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to list conversations');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleManualReply(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTenant(req);
  const { id } = req.params;
  const { replyText } = req.body;
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' }); return; }
  if (!replyText || typeof replyText !== 'string') { res.status(400).json({ error: 'replyText is required' }); return; }
  try {
    const convRes = await executeTenantQuery(tenantId, `SELECT platform, sender_id FROM tenant_conversations WHERE id = $1 AND tenant_id = $2;`, [id, tenantId]);
    const conv = convRes.rows[0];
    if (!conv) { res.status(404).json({ error: 'Conversation not found' }); return; }
    const creds = await getDecryptedTenantCredential(tenantId, String(conv.platform).toLowerCase());
    if (!creds?.accessToken) { res.status(503).json({ error: 'Channel Not Connected' }); return; }
    const sent = await dispatchSocialMessage({
      channel: String(conv.platform).toUpperCase() as any,
      recipientId: conv.sender_id,
      text: replyText.slice(0, 4000),
      credentials: { accessToken: creds.accessToken, accountId: creds.accountId },
    });
    if (!sent) {
      await logAiOperation({ tenantId, actorUserId: req.user.userId, actorRole: req.user.role, channel: conv.platform, intent: 'manual_inbox_reply', proposedTool: 'OUTBOUND_MESSAGE', decision: 'ALLOW', executedTool: 'dispatch_social_message', resultStatus: 'FAILED', resultMessage: 'Dispatch failed' });
      res.status(502).json({ error: 'Dispatch Failed' }); return;
    }
    await executeTenantQuery(tenantId, `UPDATE tenant_conversations SET agent_response = $1, is_escalated = false WHERE id = $2 AND tenant_id = $3;`, [replyText.slice(0, 4000), id, tenantId]);
    await logAiOperation({ tenantId, actorUserId: req.user.userId, actorRole: req.user.role, channel: conv.platform, intent: 'manual_inbox_reply', proposedTool: 'OUTBOUND_MESSAGE', decision: 'ALLOW', executedTool: 'dispatch_social_message', resultStatus: 'SUCCESS', resultMessage: 'Reply sent' });
    res.status(200).json({ success: true, message: 'Reply sent successfully' });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to dispatch manual inbox reply');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleToggleEscalation(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTenant(req);
  const { id } = req.params;
  const { isEscalated } = req.body;
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' }); return; }
  try {
    await executeTenantQuery(tenantId, `UPDATE tenant_conversations SET is_escalated = $1 WHERE id = $2 AND tenant_id = $3;`, [Boolean(isEscalated), id, tenantId]);
    await logAiOperation({ tenantId, actorUserId: req.user.userId, actorRole: req.user.role, intent: 'toggle_escalation', proposedTool: 'UPDATE_CONVERSATION', proposedParams: { id, isEscalated: Boolean(isEscalated) }, decision: 'ALLOW', executedTool: 'update_conversation', resultStatus: 'SUCCESS' });
    res.status(200).json({ success: true, isEscalated: Boolean(isEscalated) });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to toggle escalation');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
