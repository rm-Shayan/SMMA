import { Request, Response } from 'express';
import { z } from 'zod';
import { invokeAgentEngine } from '../agents/agentWorkflow';
import { saveCapturedLead, getTenantLeads } from '../services/leads/leadService';
import { logger } from '../config/logger';

const ChatSchema = z.object({
  tenantId: z.string().uuid().default('00000000-0000-0000-0000-000000000000'),
  channel: z.enum([
    'CRM_LIVE_CHAT', 'CRM_INBOX', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'LINKEDIN', 'TWITTER', 'EMAIL'
  ]).default('CRM_INBOX'),
  message: z.string().min(1, 'Message is required'),
  targetAgent: z.string().optional(),
  contact: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    crmStage: z.string().optional(),
  }).optional().default({}),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional().default([]),
  brandVoice: z.string().optional(),
});

export async function handleAgentChat(req: Request, res: Response): Promise<void> {
  const parseResult = ChatSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid Request', details: parseResult.error.format() });
    return;
  }

  const { tenantId, channel, message, targetAgent, contact, conversationHistory, brandVoice } = parseResult.data;
  const activeTenantId = req.tenantId || tenantId;

  try {
    const finalState = await invokeAgentEngine({
      tenantId: activeTenantId,
      channel,
      incomingMessage: message,
      targetAgent,
      contact,
      conversationHistory: conversationHistory as any,
      brandVoice: brandVoice || 'Authoritative, technical, helpful, and brand-aligned',
    });

    if (finalState.crmContactUpdates) {
      saveCapturedLead({
        tenantId: activeTenantId,
        name: finalState.crmContactUpdates.name || contact.name,
        phone: finalState.crmContactUpdates.phone || contact.phone,
        email: finalState.crmContactUpdates.email || contact.email,
        channel,
        inquiryInterest: message,
        leadScore: finalState.leadScore,
        crmStage: finalState.suggestedPipelineStage,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      agentAssigned: finalState.targetAgent,
      response: finalState.generatedResponse,
      intent: finalState.intent,
      leadScore: finalState.leadScore,
      suggestedPipelineStage: finalState.suggestedPipelineStage,
      crmContactUpdates: finalState.crmContactUpdates,
      requiresHumanReview: finalState.requiresHumanReview,
      confidenceScore: finalState.confidenceScore,
      executionTrace: finalState.executionTrace,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Agent invocation failed');
    res.status(500).json({ error: error.message });
  }
}

export async function handleDirectAgent(req: Request, res: Response): Promise<void> {
  const raw = req.params.agentName;
  const name = String(Array.isArray(raw) ? raw[0] : raw || '');
  const message = req.body.message || req.body.prompt || '';

  if (!message) {
    res.status(400).json({ error: 'message or prompt is required' });
    return;
  }

  const aliases: Record<string, string> = {
    chatbot: 'INBOX_SUPPORT_MANAGER',
    closer: 'INBOX_SUPPORT_MANAGER',
    dm: 'DM_HANDLER',
    'write-post': 'POST_DISTRIBUTION',
    post: 'POST_DISTRIBUTION',
    trends: 'TREND_IDENTIFIER',
    ideas: 'TREND_IDENTIFIER',
    research: 'COMPETITIVE_RESEARCHER',
    comment: 'COMMENT_REPLY',
    analytics: 'ANALYTICS',
  };

  const resolved = aliases[name.toLowerCase()] || name.toUpperCase();

  try {
    const finalState = await invokeAgentEngine({
      tenantId: req.tenantId || req.body.tenantId || '00000000-0000-0000-0000-000000000000',
      channel: req.body.channel || 'DIRECT_TOOL',
      incomingMessage: message,
      targetAgent: resolved,
      brandVoice: req.body.brandVoice || 'Bold, concise, authoritative',
    });

    res.status(200).json({
      success: true,
      agentUsed: resolved,
      output: finalState.generatedResponse,
      executionTrace: finalState.executionTrace,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function handleListLeads(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId || (req.query.tenantId as string) || '00000000-0000-0000-0000-000000000000';
  const leads = await getTenantLeads(tenantId);
  res.status(200).json({ success: true, count: leads.length, leads });
}
