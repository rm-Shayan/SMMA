import { Request, Response } from 'express';
import { pool } from '../../core/database/pool.database';
import { logger } from '../../core/config/logger.config';
import { dispatchSocialMessage } from '../social/dispatcher.service';
import { getDecryptedTenantCredential } from '../credentials/credentials.service';

export async function handleListConversations(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const platform = req.query.platform as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);

  const sql = platform
    ? `SELECT id, platform, sender_id, incoming_text, intent_category, agent_response, is_escalated, created_at 
       FROM tenant_conversations WHERE tenant_id = $1 AND platform = $2 ORDER BY created_at DESC LIMIT $3;`
    : `SELECT id, platform, sender_id, incoming_text, intent_category, agent_response, is_escalated, created_at 
       FROM tenant_conversations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2;`;
  const params = platform ? [tenantId, platform, limit] : [tenantId, limit];

  try {
    const dbRes = await pool.query(sql, params);
    res.status(200).json({ success: true, count: dbRes.rows.length, conversations: dbRes.rows });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to list conversations');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleManualReply(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const { replyText } = req.body;

  if (!tenantId) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' });
    return;
  }
  if (!replyText) {
    res.status(400).json({ error: 'replyText is required' });
    return;
  }

  try {
    const convRes = await pool.query(
      `SELECT platform, sender_id FROM tenant_conversations WHERE id = $1 AND tenant_id = $2;`,
      [id, tenantId]
    );
    const conv = convRes.rows[0];
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const creds = await getDecryptedTenantCredential(tenantId, conv.platform.toLowerCase());
    if (!creds?.accessToken) {
      res.status(503).json({ error: 'Channel Not Connected', message: `No credentials configured for ${conv.platform}` });
      return;
    }

    const sent = await dispatchSocialMessage({
      channel: conv.platform.toUpperCase() as any,
      recipientId: conv.sender_id,
      text: replyText,
      credentials: {
        accessToken: creds.accessToken,
        accountId: creds.accountId,
      },
    });
    if (!sent) {
      res.status(502).json({ error: 'Dispatch Failed', message: 'Platform rejected the message' });
      return;
    }

    await pool.query(
      `UPDATE tenant_conversations SET agent_response = $1, is_escalated = false WHERE id = $2;`,
      [replyText, id]
    );

    res.status(200).json({ success: true, message: 'Reply sent successfully' });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to dispatch manual inbox reply');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleToggleEscalation(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const { isEscalated } = req.body;

  try {
    await pool.query(
      `UPDATE tenant_conversations SET is_escalated = $1 WHERE id = $2 AND tenant_id = $3;`,
      [Boolean(isEscalated), id, tenantId]
    );
    res.status(200).json({ success: true, isEscalated: Boolean(isEscalated) });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to toggle escalation');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

