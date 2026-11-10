import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { z } from 'zod';

const SupervisorDecisionSchema = z.object({
  targetAgent: z.enum([
    'SELF_COMMENTER', 'COMPETITIVE_RESEARCHER', 'COMMENT_REPLY', 'ANALYTICS',
    'TREND_IDENTIFIER', 'DM_HANDLER', 'COMPETITOR_ENGAGEMENT', 'POST_DISTRIBUTION',
    'INBOX_SUPPORT_MANAGER'
  ]),
  reasoning: z.string().max(300),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export async function supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
  if (state.targetAgent) {
    return {
      executionTrace: [`Direct invocation: ${state.targetAgent} (Supervisor auto-bypass)`],
    };
  }

  const prompt = `You are Agent #10: System Supervisor & Event Router.
Analyze the incoming message and route it to the single best specialized agent:
- DM_HANDLER: Quick lead qualification or intro chat.
- INBOX_SUPPORT_MANAGER: Complex questions, objections, pricing, booking.
- COMMENT_REPLY: Public social comment engagement.
- TREND_IDENTIFIER: Content topic/hook generation.
- POST_DISTRIBUTION: Formatting/scheduling post.
- COMPETITIVE_RESEARCHER: Market research or competitor analysis.

Incoming: "${state.incomingMessage}"
Channel: ${state.channel}
Output JSON matching schema.`;

  try {
    const rawDecision = await callQwenJson<z.infer<typeof SupervisorDecisionSchema>>([
      { role: 'system', content: prompt },
      { role: 'user', content: `Route this event: "${state.incomingMessage}"` },
    ], { temperature: 0.1 });

    const parsed = SupervisorDecisionSchema.safeParse(rawDecision);
    const target = parsed.success ? parsed.data.targetAgent : 'INBOX_SUPPORT_MANAGER';

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
