import { Request, Response } from 'express';
import { z } from 'zod';
import { invokeAgentEngine } from './agent.workflow';
import { saveCapturedLead, getTenantLeads } from '../leads/lead.service';
import { logger } from '../../core/config/logger.config';
import { logAiOperation } from './agent.audit';

const UniversalChatRequestSchema = z.object({
  tenantId: z.string().uuid().optional(),
  channel: z.enum(['CRM_LIVE_CHAT', 'CRM_INBOX', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'LINKEDIN', 'TWITTER', 'EMAIL']),
  message: z.string().min(1),
  senderId: z.string().min(1),
  senderName: z.string().optional(),
  targetAgent: z.string().optional(),
});

function resolveTenantId(req: Request, bodyTenantId?: string): string | null {
  if (req.user?.role === 'SUPERADMIN') return bodyTenantId || req.tenantId || req.user.tenantId || null;
  return req.user?.tenantId || req.tenantId || null;
}

export async function handleAgentChat(req: Request, res: Response): Promise<void> {
  const parsed = UniversalChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Request', details: parsed.error.format() });
    return;
  }

  const { channel, message, senderId, senderName, targetAgent } = parsed.data;
  const tenantId = resolveTenantId(req, parsed.data.tenantId);
  if (!tenantId || !req.user) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' });
    return;
  }

  try {
    const finalState = await invokeAgentEngine({
      tenantId, channel, incomingMessage: message, senderId, senderName, targetAgent,
      actor: { userId: req.user.userId, role: req.user.role, tenantId },
    });

    if (finalState.crmContactUpdates?.phone || finalState.crmContactUpdates?.email) {
      const leadId = await saveCapturedLead({
        tenantId, channel, name: finalState.crmContactUpdates.name || senderName,
        phone: finalState.crmContactUpdates.phone, email: finalState.crmContactUpdates.email,
        inquiryInterest: message, leadScore: finalState.leadScore, crmStage: finalState.suggestedPipelineStage,
      });
      await logAiOperation({
        tenantId, actorUserId: req.user.userId, actorRole: req.user.role, channel, intent: 'capture_lead',
        proposedTool: 'UPSERT_LEAD', proposedParams: { channel }, decision: 'ALLOW', executedTool: 'save_lead',
        resultStatus: leadId ? 'SUCCESS' : 'FAILED',
      });
    }

    res.status(200).json({
      success: true, agentAssigned: finalState.targetAgent, response: finalState.generatedResponse,
      leadScore: finalState.leadScore, suggestedStage: finalState.suggestedPipelineStage,
      requiresHumanReview: finalState.requiresHumanReview, executionTrace: finalState.executionTrace,
    });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Agent chat error');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleDirectAgent(req: Request, res: Response): Promise<void> {
  const rawAgent = req.params.agentName;
  const agentName = String(Array.isArray(rawAgent) ? rawAgent[0] : rawAgent || '').toLowerCase();
  const { tenantId, message, channel } = req.body;
  const agentMapping: Record<string, string> = {
    self_comment: 'SELF_COMMENTER', researcher: 'COMPETITIVE_RESEARCHER', comment_reply: 'COMMENT_REPLY',
    analytics: 'ANALYTICS', trend_planner: 'TREND_IDENTIFIER', dm_handler: 'DM_HANDLER',
    publisher: 'POST_DISTRIBUTION', support_closer: 'INBOX_SUPPORT_MANAGER',
  };
  const targetAgent = agentMapping[agentName] || 'INBOX_SUPPORT_MANAGER';
  const resolvedTenantId = resolveTenantId(req, tenantId);
  if (!resolvedTenantId || !req.user) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' });
    return;
  }
  try {
    const finalState = await invokeAgentEngine({
      tenantId: resolvedTenantId, channel: channel || 'CRM_LIVE_CHAT', incomingMessage: message || 'Proceed with task',
      targetAgent, actor: { userId: req.user.userId, role: req.user.role, tenantId: resolvedTenantId },
    });
    res.status(200).json({ success: true, agent: targetAgent, output: finalState.generatedResponse, trace: finalState.executionTrace });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Direct agent invocation error');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleListLeads(req: Request, res: Response): Promise<void> {
  const queryTenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
  const tenantId = resolveTenantId(req, queryTenantId);
  if (!tenantId || !req.user) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' });
    return;
  }
  const leads = await getTenantLeads(tenantId);
  await logAiOperation({
    tenantId, actorUserId: req.user.userId, actorRole: req.user.role, channel: 'CRM_LIVE_CHAT',
    intent: 'list_leads', proposedTool: 'QUERY_DATA', proposedParams: { entity: 'LEADS' },
    decision: 'ALLOW', executedTool: 'query_leads', resultStatus: 'SUCCESS', resultMessage: `Returned ${leads.length} leads`,
  });
  res.status(200).json({ success: true, count: leads.length, leads });
}
