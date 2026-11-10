import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { env } from '../../core/config/env.config';
import { sanitizeAndScoreText, validatePhone, validateEmail } from '../../core/ai/quality.validator';
import { getRelevantTrainingContext } from '../training/training.service';
import { z } from 'zod';

const CloserSchema = z.object({
  responseText: z.string().min(5),
  leadScore: z.number().min(0).max(100).optional(),
  suggestedPipelineStage: z.enum([
    'NEW_LEAD', 'QUALIFIED_HOT', 'DEMO_REQUESTED', 'CUSTOMER_SUPPORT', 'ESCALATED'
  ]).optional(),
  extractedContact: z.object({
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  }).optional(),
  crmTags: z.array(z.string()).optional(),
  bookingLinkProvided: z.boolean().optional(),
  escalateToHuman: z.boolean().optional(),
});

export async function supportCloserNode(state: AgentState): Promise<Partial<AgentState>> {
  const bookingLink = state.bookingCalendarUrl || env.CALENDAR_BOOKING_URL || 'https://calendly.com/discovery';
  const companyKnowledge = await getRelevantTrainingContext(state.tenantId, state.incomingMessage, 'PUBLIC');

  const systemPrompt = `You are Agent #9: Elite Sales Closer & Objections Specialist.
You represent this company in all high-stakes communications with external prospects, companies, and clients.
Brand Voice: ${state.brandVoice}

Verified Company Knowledge Base (RAG):
${companyKnowledge}

Strict Rules:
1. Ground your answers strictly in the company's verified documentation above. Quote our real packages, refund policies, and SLAs accurately.
2. Address objections with empathy, authority, and confidence.
3. If the user mentions legal issues, scams, or refunds outside policy, set escalateToHuman = true immediately.
4. If they ask about calls, demos, or packages, direct them to: ${bookingLink}
Output valid JSON.`;

  const userPrompt = `External Inquiry: "${state.incomingMessage}". Prior Conversation: ${JSON.stringify(state.conversationHistory.slice(-4))}`;

  try {
    const raw = await callQwenJson<any>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.2 });

    const parsed = CloserSchema.safeParse(raw);
    const rawResponse = parsed.success ? parsed.data.responseText : (raw?.responseText || 'Thank you for reaching out. Let us schedule a brief discovery call to discuss our solutions.');
    const qResult = sanitizeAndScoreText(rawResponse, state.channel);

    const validPhone = validatePhone(raw?.extractedContact?.phone || parsed.data?.extractedContact?.phone);
    const validEmail = validateEmail(raw?.extractedContact?.email || parsed.data?.extractedContact?.email);

    return {
      generatedResponse: qResult.cleanedText,
      leadScore: parsed.data?.leadScore ?? (raw?.leadScore || 70),
      suggestedPipelineStage: parsed.data?.suggestedPipelineStage || 'NEW_LEAD',
      requiresHumanReview: parsed.data?.escalateToHuman ?? (raw?.escalateToHuman || false),
      crmContactUpdates: {
        name: raw?.extractedContact?.name || null,
        phone: validPhone,
        email: validEmail,
      },
      executionTrace: [`Agent #9 (Sales Closer) RAG-grounded response. Quality: ${qResult.score}/100`],
    };
  } catch {
    return {
      generatedResponse: `Thank you for connecting with us. We would love to discuss custom solutions tailored to your business goals.`,
      requiresHumanReview: false,
      executionTrace: ['Agent #9 fallback closer executed'],
    };
  }
}
