import { pool } from '../../core/database/pool.database';
import { logger } from '../../core/config/logger.config';
import { executeTenantQuery } from '../../core/database/tenant-query.database';

export type AuditDecision = 'ALLOW' | 'DENY' | 'NEEDS_APPROVAL' | 'ERROR';
export type AuditResultStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

export interface AiOperationLogInput {
  tenantId?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  channel?: string | null;
  intent?: string | null;
  proposedTool?: string | null;
  proposedParams?: any;
  decision: AuditDecision;
  decisionReason?: string | null;
  executedTool?: string | null;
  resultStatus?: AuditResultStatus | null;
  resultMessage?: string | null;
  resultData?: any;
  idempotencyKey?: string | null;
}

function redact(value: any, depth = 0): any {
  if (value == null || depth > 4) return value;
  if (typeof value === 'string') return value.length > 500 ? value.slice(0, 500) + '…' : value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (/password|secret|token|auth|credential|key/i.test(k)) out[k] = '[REDACTED]';
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export async function logAiOperation(input: AiOperationLogInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO ai_operation_logs
        (tenant_id, actor_user_id, actor_role, channel, intent, proposed_tool, proposed_params, decision, decision_reason, executed_tool, result_status, result_message, result_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        input.tenantId || null,
        input.actorUserId || null,
        input.actorRole || null,
        input.channel || null,
        input.intent || null,
        input.proposedTool || null,
        JSON.stringify(redact(input.proposedParams ?? {})),
        input.decision,
        input.decisionReason || null,
        input.executedTool || null,
        input.resultStatus || null,
        input.resultMessage ? String(input.resultMessage).slice(0, 2000) : null,
        input.resultData == null ? null : JSON.stringify(redact(input.resultData)),
      ]
    );
  } catch (err: any) {
    logger.error({ err: err.message, tenantId: input.tenantId }, 'Failed to write AI operation audit log');
  }
}

export async function logOutboundCall(input: {
  tenantId: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  toolName: string;
  method?: string;
  destinationHost?: string;
  destinationPath?: string;
  decision: 'ALLOW' | 'DENY' | 'NEEDS_APPROVAL';
  decisionReason?: string;
  status?: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  statusCode?: number | null;
  latencyMs?: number | null;
  error?: string | null;
}): Promise<void> {
  try {
    await executeTenantQuery(input.tenantId, `INSERT INTO outbound_call_logs
      (tenant_id, actor_user_id, actor_role, tool_name, method, destination_host, destination_path_redacted, decision, decision_reason, status, status_code, latency_ms, error_redacted)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [input.tenantId, input.actorUserId || null, input.actorRole || null, input.toolName, input.method || null, input.destinationHost || null, input.destinationPath || null, input.decision, input.decisionReason || null, input.status || null, input.statusCode ?? null, input.latencyMs ?? null, input.error ? String(input.error).slice(0, 500) : null]
    );
  } catch (err: any) {
    logger.warn({ err: err.message, tenantId: input.tenantId }, 'Failed to write outbound call log');
  }
}

export async function createApprovalRequest(input: {
  tenantId: string;
  actorUserId?: string;
  actorRole?: string;
  toolName: string;
  proposedParams: any;
  decisionReason?: string;
  idempotencyKey?: string;
}): Promise<string | null> {
  try {
    const res = await executeTenantQuery(input.tenantId, `INSERT INTO ai_action_approvals
      (tenant_id, actor_user_id, actor_role, tool_name, proposed_params, status, decision_reason, idempotency_key)
      VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7)
      RETURNING id`,
      [input.tenantId, input.actorUserId || null, input.actorRole || null, input.toolName, JSON.stringify(redact(input.proposedParams || {})), input.decisionReason || null, input.idempotencyKey || null]
    );
    return res.rows[0]?.id || null;
  } catch (err: any) {
    logger.error({ err: err.message, tenantId: input.tenantId }, 'Failed to create approval request');
    return null;
  }
}
