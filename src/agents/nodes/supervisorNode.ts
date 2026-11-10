import { AgentState } from '../state/agentState';
import { callQwenJson } from '../../ai/qwenClient';
import { z } from 'zod';

const RouteSchema = z.object({
  targetAgent: z.enum([
    'DM_HANDLER', 'INBOX_SUPPORT_MANAGER', 'SELF_COMMENTER', 'COMMENT_REPLY',
    'COMPETITIVE_RESEARCHER', 'ANALYTICS', 'TREND_IDENTIFIER', 'POST_DISTRIBUTION',
    'COMPETITOR_ENGAGEMENT', 'IGNORE'
  ]),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']),
  reasoning: z.string(),
});

export async function supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
  // If caller explicitly requested a specific agent, bypass routing LLM call!
  if (state.targetAgent) {
    return {
      targetAgent: state.targetAgent,
      executionTrace: [`Direct invocation: ${state.targetAgent} (Supervisor auto-bypass)`],
    };
  }

  const systemPrompt = `You are Agent #10: Supervisor & System Router.
Evaluate the incoming message, channel, and history to select the single best specialized agent.
Channel: ${state.channel}
Brand Voice: ${state.brandVoice}

Routing Logic:
- If customer asks a direct question, pricing, or support -> INBOX_SUPPORT_MANAGER
- If greeting, initial DM, or quick lead qualification -> DM_HANDLER
- If public post comment -> COMMENT_REPLY
- If scheduled task for content ideation -> TREND_IDENTIFIER
- If post formatting -> POST_DISTRIBUTION
Output JSON conforming strictly to: { "targetAgent": "...", "priority": "...", "reasoning": "..." }`;

  const userPrompt = `Message: "${state.incomingMessage}". Contact: ${JSON.stringify(state.contact)}`;

  try {
    const result = await callQwenJson<z.infer<typeof RouteSchema>>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.1 });

    const validated = RouteSchema.safeParse(result);
    const target = validated.success ? validated.data.targetAgent : 'INBOX_SUPPORT_MANAGER';

    return {
      targetAgent: target,
      executionTrace: [`Supervisor routed to ${target}`],
    };
  } catch {
    return {
      targetAgent: 'INBOX_SUPPORT_MANAGER',
      executionTrace: ['Supervisor fallback to INBOX_SUPPORT_MANAGER'],
    };
  }
}
