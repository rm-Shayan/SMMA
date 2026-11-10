import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { env } from '../../core/config/env.config';
import { z } from 'zod';

const CloserSchema = z.object({
  responseText: z.string().min(5),
  leadScore: z.number().min(0).max(100),
  suggestedPipelineStage: z.enum([
    'NEW_LEAD', 'QUALIFIED_HOT', 'DEMO_REQUESTED', 'CUSTOMER_SUPPORT', 'ESCALATED'
  ]),
  crmTags: z.array(z.string()),
  bookingLinkProvided: z.boolean(),
  escalateToHuman: z.boolean(),
  confidenceScore: z.number().min(0).max(1),
});

export async function supportCloserNode(state: AgentState): Promise<Partial<AgentState>> {
  const bookingLink = state.bookingCalendarUrl || env.CALENDAR_BOOKING_URL || 'https://calendly.com/discovery';
  const systemPrompt = `You are Agent #9: CRM Closer & Support Manager.
Your role is to answer complex questions, handle sales objections, schedule meetings, and update CRM lead stages.
Brand Voice: ${state.brandVoice}

Strict Rules:
1. Never hallucinate fake pricing or guarantee unverified timelines.
2. If the user is an active buyer, assign leadScore > 75 and suggestedPipelineStage = "QUALIFIED_HOT".
3. If they ask about disputes, refunds, or lawsuits, set escalateToHuman = true.
4. If they inquire about consultations, calls, or pricing, offer the booking link: ${bookingLink}
Output valid JSON matching schema.`;

  const userPrompt = `Customer inquiry: "${state.incomingMessage}". Conversation History: ${JSON.stringify(state.conversationHistory.slice(-4))}`;

  try {
    const raw = await callQwenJson<z.infer<typeof CloserSchema>>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.2 });

    const parsed = CloserSchema.safeParse(raw);
    const data = parsed.success ? parsed.data : {
      responseText: `Thank you for your message. Would you like to schedule a 15-minute intro call to discuss custom solutions?`,
      leadScore: 60,
      suggestedPipelineStage: 'NEW_LEAD' as const,
      crmTags: ['inbound_inquiry'],
      bookingLinkProvided: false,
      escalateToHuman: false,
      confidenceScore: 0.85,
    };

    return {
      generatedResponse: data.responseText,
      leadScore: data.leadScore,
      suggestedPipelineStage: data.suggestedPipelineStage,
      crmContactUpdates: { tags: data.crmTags, score: data.leadScore, stage: data.suggestedPipelineStage },
      requiresHumanReview: data.escalateToHuman,
      confidenceScore: data.confidenceScore,
      executionTrace: [`Agent #9 (Closer) stage: ${data.suggestedPipelineStage}, score: ${data.leadScore}`],
    };
  } catch {
    return {
      generatedResponse: `I've forwarded your request to our senior consultant who will follow up shortly.`,
      leadScore: 50,
      suggestedPipelineStage: 'NEW_LEAD',
      requiresHumanReview: true,
      confidenceScore: 0.6,
      executionTrace: ['Agent #9 fallback triggered'],
    };
  }
}
