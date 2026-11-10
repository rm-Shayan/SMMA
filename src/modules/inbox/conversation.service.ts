import { pool } from '../../core/database/pool.database';
import { logger } from '../../core/config/logger.config';

export interface ConversationLogInput {
  tenantId: string;
  platform: string;
  senderId: string;
  incomingText: string;
  intentCategory?: string | null;
  agentResponse?: string | null;
  isEscalated?: boolean;
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getRecentConversationHistory(
  tenantId: string,
  platform: string,
  senderId: string,
  limit = 8
): Promise<HistoryMessage[]> {
  try {
    const res = await pool.query(
      `SELECT incoming_text, agent_response FROM tenant_conversations
       WHERE tenant_id = $1 AND platform = $2 AND sender_id = $3
       ORDER BY created_at DESC LIMIT $4;`,
      [tenantId, platform, senderId, limit]
    );
    const history: HistoryMessage[] = [];
    for (const row of res.rows.reverse()) {
      if (row.incoming_text) history.push({ role: 'user', content: row.incoming_text });
      if (row.agent_response) history.push({ role: 'assistant', content: row.agent_response });
    }
    return history;
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to load conversation history');
    return [];
  }
}

export async function isConversationEscalated(
  tenantId: string,
  platform: string,
  senderId: string
): Promise<boolean> {
  try {
    const res = await pool.query(
      `SELECT is_escalated FROM tenant_conversations
       WHERE tenant_id = $1 AND platform = $2 AND sender_id = $3
       ORDER BY created_at DESC LIMIT 1;`,
      [tenantId, platform, senderId]
    );
    return res.rows[0]?.is_escalated === true;
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to check escalation state');
    return false;
  }
}

export async function logConversation(input: ConversationLogInput): Promise<void> {
  const sql = `
    INSERT INTO tenant_conversations
      (tenant_id, platform, sender_id, incoming_text, intent_category, agent_response, is_escalated)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `;
  try {
    await pool.query(sql, [
      input.tenantId,
      input.platform,
      input.senderId,
      input.incomingText,
      input.intentCategory || null,
      input.agentResponse || null,
      input.isEscalated || false,
    ]);
  } catch (err: any) {
    logger.error({ err: err.message, tenantId: input.tenantId }, 'Failed to log conversation');
  }
}
