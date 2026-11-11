import { AgentState } from './agent.state';
import { logAiOperation, createApprovalRequest } from './agent.audit';
import { listTenantExternalTools } from '../tools/external-tools.service';
import { checkAndConsumeRateLimit, reserveIdempotency } from '../../core/security/egress.policy';
import {
  executeToolPublishPost,
  executeToolScheduleCalendar,
  executeToolCreateSheet,
  executeToolSendEmailAlert,
  executeToolQueryData,
  executeToolExternalAction,
  ToolResult,
} from './tools.executor';
import { ActorRole, ActorContext, normalizeTool, safeStr, validateParams } from './agent.policy-validator';

export { ActorRole, ActorContext };

type SideEffect = 'READ' | 'WRITE' | 'DESTRUCTIVE';
type ToolPolicy = { roles: ActorRole[]; sideEffect: SideEffect; requiresApproval?: boolean; rateLimitPerMin?: number };

const TOOL_POLICIES: Record<string, ToolPolicy> = {
  PUBLISH_POST: { roles: ['SUPERADMIN', 'CLIENT_OWNER'], sideEffect: 'WRITE', requiresApproval: true, rateLimitPerMin: 20 },
  SCHEDULE_CALENDAR: { roles: ['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR'], sideEffect: 'WRITE', requiresApproval: true, rateLimitPerMin: 30 },
  CREATE_SHEET: { roles: ['SUPERADMIN', 'CLIENT_OWNER'], sideEffect: 'WRITE', requiresApproval: true, rateLimitPerMin: 20 },
  SEND_EMAIL_ALERT: { roles: ['SUPERADMIN', 'CLIENT_OWNER'], sideEffect: 'WRITE', requiresApproval: true, rateLimitPerMin: 20 },
  QUERY_DATA: { roles: ['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR'], sideEffect: 'READ', rateLimitPerMin: 60 },
  EXTERNAL_ACTION: { roles: ['SUPERADMIN', 'CLIENT_OWNER'], sideEffect: 'WRITE', requiresApproval: true, rateLimitPerMin: 30 },
  NONE: { roles: ['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR', 'TRAINEE'], sideEffect: 'READ' },
};

const EXTERNAL_DESTRUCTIVE = /\b(delete|remove|drop|cancel|refund|disable|terminate|destroy|purge|close_account)\b/i;

export async function authorizeAndExecuteProposedTool(
  state: any,
  proposed: { tool: any; params: any; summary?: string }
): Promise<{ tool: string; params: any; result: ToolResult | null; summary: string; denied?: boolean; reason?: string; approvalId?: string }> {
  const actor = state.actor as ActorContext | undefined;
  const tool = normalizeTool(proposed.tool);
  const summary = safeStr(proposed.summary || 'Action processed.', 500);
  const baseAudit = { tenantId: state.tenantId, actorUserId: actor?.userId, actorRole: actor?.role, channel: state.channel, intent: state.incomingMessage };

  if (!actor || !actor.tenantId || !actor.role) {
    await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: 'Missing actor context', resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: 'Action denied: missing authenticated context.', denied: true, reason: 'Missing actor context' };
  }
  if (actor.tenantId !== state.tenantId) {
    await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: 'Tenant mismatch', resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: 'Action denied: tenant mismatch.', denied: true, reason: 'Tenant mismatch' };
  }

  const policy = TOOL_POLICIES[tool];
  if (!policy || !policy.roles.includes(actor.role)) {
    await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: `Role ${actor.role} not permitted for ${tool}`, resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: `Action denied: your role cannot perform ${tool}.`, denied: true, reason: 'Insufficient role permission' };
  }

  const validated = validateParams(tool, proposed.params);
  if (!validated.ok) {
    await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: (validated as any).reason, resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: `Action denied: ${(validated as any).reason}.`, denied: true, reason: (validated as any).reason };
  }

  const isSystemActor = actor.userId === 'system-cadence' || actor.userId === 'system-scheduler';
  if (tool === 'NONE') {
    await logAiOperation({ ...baseAudit, proposedTool: 'NONE', proposedParams: {}, decision: 'ALLOW', decisionReason: 'No tool execution requested', resultStatus: 'SKIPPED' });
    return { tool, params: {}, result: null, summary };
  }

  const rate = await checkAndConsumeRateLimit(state.tenantId, actor.userId, tool, policy.rateLimitPerMin || 30);
  if (!rate.ok) {
    await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: validated.params, decision: 'DENY', decisionReason: rate.reason || 'Rate limited', resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: `Action denied: ${rate.reason || 'rate limit exceeded'}.`, denied: true, reason: rate.reason };
  }

  const idem = await reserveIdempotency(state.tenantId, actor.userId, tool, (validated.params as any).idempotencyKey, validated.params);
  if (!idem.ok) {
    await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: validated.params, decision: 'DENY', decisionReason: 'Duplicate idempotency key', resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: 'Action denied: duplicate request (idempotency).', denied: true, reason: 'Duplicate idempotency key' };
  }

  if (tool === 'EXTERNAL_ACTION') {
    const extTools = await listTenantExternalTools(state.tenantId);
    const exists = extTools.some((t: any) => t.toolName === (validated.params as any).externalToolName);
    if (!exists) {
      await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: validated.params, decision: 'DENY', decisionReason: 'External tool not registered for tenant', resultStatus: 'SKIPPED' });
      return { tool: 'NONE', params: {}, result: null, summary: 'Action denied: external tool not registered for this tenant.', denied: true, reason: 'External tool not allowed' };
    }
  }

  const destructiveExternal = tool === 'EXTERNAL_ACTION' && EXTERNAL_DESTRUCTIVE.test(String((validated.params as any).externalToolName || '') + ' ' + JSON.stringify((validated.params as any).externalParams || {}));
  const needsApproval = !isSystemActor && (policy.requiresApproval || destructiveExternal || policy.sideEffect === 'DESTRUCTIVE');
  if (needsApproval) {
    const approvalId = await createApprovalRequest({ tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, toolName: tool, proposedParams: validated.params, decisionReason: destructiveExternal ? 'Destructive/high-risk action requires approval' : 'Side-effecting action requires approval', idempotencyKey: (validated.params as any).idempotencyKey });
    await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: validated.params, decision: 'NEEDS_APPROVAL', decisionReason: 'Queued for approval', resultStatus: 'SKIPPED' });
    return { tool, params: validated.params, result: null, summary: `Action queued for approval${approvalId ? ` (id: ${approvalId})` : ''}.`, denied: true, reason: 'Needs approval', approvalId: approvalId || undefined };
  }

  await logAiOperation({ ...baseAudit, proposedTool: tool, proposedParams: validated.params, decision: 'ALLOW', decisionReason: 'Policy checks passed', resultStatus: 'SKIPPED' });

  let result: ToolResult;
  try {
    switch (tool) {
      case 'PUBLISH_POST':
        result = await executeToolPublishPost(state.tenantId, (validated.params as any).platform, (validated.params as any).postContent);
        break;
      case 'SCHEDULE_CALENDAR':
        result = await executeToolScheduleCalendar(state.tenantId, (validated.params as any).meetingTitle, (validated.params as any).attendeeEmail, (validated.params as any).startTimeIso, (validated.params as any).duration);
        break;
      case 'CREATE_SHEET':
        result = await executeToolCreateSheet(state.tenantId, (validated.params as any).sheetTitle, (validated.params as any).headers);
        break;
      case 'SEND_EMAIL_ALERT':
        result = await executeToolSendEmailAlert((validated.params as any).toEmail, 'Client Account', (validated.params as any).subject, (validated.params as any).bodyText);
        break;
      case 'QUERY_DATA':
        result = await executeToolQueryData(state.tenantId, (validated.params as any).entity);
        break;
      case 'EXTERNAL_ACTION':
        result = await executeToolExternalAction(state.tenantId, (validated.params as any).externalToolName, (validated.params as any).externalParams, { userId: actor.userId, role: actor.role });
        break;
      default:
        result = { success: false, action: tool, message: 'Unsupported tool' };
    }
  } catch (err: any) {
    result = { success: false, action: tool, message: err?.message || 'Tool execution failed' };
  }

  await logAiOperation({
    ...baseAudit, proposedTool: tool, proposedParams: validated.params, decision: 'ALLOW', decisionReason: 'Executed after policy gate',
    executedTool: result.action || tool, resultStatus: result.success ? 'SUCCESS' : 'FAILED', resultMessage: result.message, resultData: result.data,
  });

  return { tool, params: validated.params, result, summary };
}
