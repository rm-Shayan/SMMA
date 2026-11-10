import { AgentState } from './agent.state';
import { logAiOperation } from './agent.audit';
import { listTenantExternalTools } from '../tools/external-tools.service';
import {
  executeToolPublishPost,
  executeToolScheduleCalendar,
  executeToolCreateSheet,
  executeToolSendEmailAlert,
  executeToolQueryData,
  executeToolExternalAction,
  ToolResult,
} from './tools.executor';
import {
  ActorRole,
  ActorContext,
  TOOL_CAPABILITIES,
  normalizeTool,
  safeStr,
  validateParams,
} from './agent.policy-validator';

export { ActorRole, ActorContext, TOOL_CAPABILITIES };

export async function authorizeAndExecuteProposedTool(
  state: AgentState,
  proposed: { tool: any; params: any; summary?: string }
): Promise<{ tool: string; params: any; result: ToolResult | null; summary: string; denied?: boolean; reason?: string }> {
  const actor = state.actor as ActorContext | undefined;
  const tool = normalizeTool(proposed.tool);
  const summary = safeStr(proposed.summary || 'Action processed.', 500);

  if (!actor || !actor.tenantId || !actor.role) {
    await logAiOperation({ tenantId: state.tenantId, channel: state.channel, intent: state.incomingMessage, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: 'Missing actor context', resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: 'Action denied: missing authenticated context.', denied: true, reason: 'Missing actor context' };
  }
  if (actor.tenantId !== state.tenantId) {
    await logAiOperation({ tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, channel: state.channel, intent: state.incomingMessage, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: 'Tenant mismatch', resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: 'Action denied: tenant mismatch.', denied: true, reason: 'Tenant mismatch' };
  }

  const allowedRoles = TOOL_CAPABILITIES[tool] || [];
  if (!allowedRoles.includes(actor.role)) {
    await logAiOperation({ tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, channel: state.channel, intent: state.incomingMessage, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: `Role ${actor.role} not permitted for ${tool}`, resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: `Action denied: your role cannot perform ${tool}.`, denied: true, reason: 'Insufficient role permission' };
  }

  const validated = validateParams(tool, proposed.params);
  if (!validated.ok) {
    await logAiOperation({ tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, channel: state.channel, intent: state.incomingMessage, proposedTool: tool, proposedParams: proposed.params, decision: 'DENY', decisionReason: validated.reason, resultStatus: 'SKIPPED' });
    return { tool: 'NONE', params: {}, result: null, summary: `Action denied: ${validated.reason}.`, denied: true, reason: validated.reason };
  }

  if (tool === 'NONE') {
    await logAiOperation({ tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, channel: state.channel, intent: state.incomingMessage, proposedTool: 'NONE', proposedParams: {}, decision: 'ALLOW', decisionReason: 'No tool execution requested', resultStatus: 'SKIPPED' });
    return { tool, params: {}, result: null, summary };
  }

  if (tool === 'EXTERNAL_ACTION') {
    const extTools = await listTenantExternalTools(state.tenantId);
    const exists = extTools.some((t) => t.toolName === validated.params.externalToolName);
    if (!exists) {
      await logAiOperation({ tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, channel: state.channel, intent: state.incomingMessage, proposedTool: tool, proposedParams: validated.params, decision: 'DENY', decisionReason: 'External tool not registered for tenant', resultStatus: 'SKIPPED' });
      return { tool: 'NONE', params: {}, result: null, summary: 'Action denied: external tool not registered for this tenant.', denied: true, reason: 'External tool not allowed' };
    }
  }

  await logAiOperation({ tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, channel: state.channel, intent: state.incomingMessage, proposedTool: tool, proposedParams: validated.params, decision: 'ALLOW', decisionReason: 'Policy checks passed', resultStatus: 'SKIPPED' });

  let result: ToolResult;
  try {
    switch (tool) {
      case 'PUBLISH_POST':
        result = await executeToolPublishPost(state.tenantId, validated.params.platform, validated.params.postContent);
        break;
      case 'SCHEDULE_CALENDAR':
        result = await executeToolScheduleCalendar(state.tenantId, validated.params.meetingTitle, validated.params.attendeeEmail, validated.params.startTimeIso, validated.params.duration);
        break;
      case 'CREATE_SHEET':
        result = await executeToolCreateSheet(state.tenantId, validated.params.sheetTitle, validated.params.headers);
        break;
      case 'SEND_EMAIL_ALERT':
        result = await executeToolSendEmailAlert(validated.params.toEmail, 'Client Account', validated.params.subject, validated.params.bodyText);
        break;
      case 'QUERY_DATA':
        result = await executeToolQueryData(state.tenantId, validated.params.entity);
        break;
      case 'EXTERNAL_ACTION':
        result = await executeToolExternalAction(state.tenantId, validated.params.externalToolName, validated.params.externalParams, actor);
        break;
      default:
        result = { success: false, action: tool, message: 'Unsupported tool' };
    }
  } catch (err: any) {
    result = { success: false, action: tool, message: err?.message || 'Tool execution failed' };
  }

  await logAiOperation({
    tenantId: state.tenantId, actorUserId: actor.userId, actorRole: actor.role, channel: state.channel,
    intent: state.incomingMessage, proposedTool: tool, proposedParams: validated.params, decision: 'ALLOW',
    decisionReason: 'Executed after policy gate', executedTool: result.action || tool,
    resultStatus: result.success ? 'SUCCESS' : 'FAILED', resultMessage: result.message, resultData: result.data,
  });

  return { tool, params: validated.params, result, summary };
}
