import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { env } from '../../core/config/env.config';
import { z } from 'zod';

const DMResponseSchema = z.object({
  intent: z.enum(['SALES_LEAD', 'SUPPORT', 'PRICING', 'BOOKING', 'SPAM']),
  immediateReply: z.string().max(500),
  extractedContact: z.object({
    name: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
  }),
  routeToDeepCloser: z.boolean(),
});

export async function inboundDmNode(state: AgentState): Promise<Partial<AgentState>> {
  const bookingLink = state.bookingCalendarUrl || env.CALENDAR_BOOKING_URL || 'https://calendly.com/discovery';
  const systemPrompt = `You are Agent #6: Inbound DM & CRM Live-Chat Handler.
Your goal is to provide an instant, warm, professional response in under 30 seconds.
Brand Voice: ${state.brandVoice}
Channel: ${state.channel}

Rules:
1. Greet the customer warmly and address their initial message.
2. If they provided a name, phone number, or email, extract it cleanly into extractedContact.
3. If they ask detailed pricing, technical objections, or contract questions, set routeToDeepCloser = true.
4. If they want to schedule a call or demo, include this calendar booking link: ${bookingLink}
Output valid JSON.`;

  const userPrompt = `Customer said: "${state.incomingMessage}". Known Contact Info: ${JSON.stringify(state.contact)}`;

  try {
    const raw = await callQwenJson<z.infer<typeof DMResponseSchema>>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.3 });

    const parsed = DMResponseSchema.safeParse(raw);
    const data = parsed.success ? parsed.data : {
      intent: 'SALES_LEAD' as const,
      immediateReply: `Thanks for reaching out! How can our team assist you today?`,
      extractedContact: { name: null, phone: null, email: null },
      routeToDeepCloser: false,
    };

    return {
      intent: data.intent,
      generatedResponse: data.immediateReply,
      crmContactUpdates: data.extractedContact,
      executionTrace: [`Agent #6 (DM Handler) generated reply. Intent: ${data.intent}`],
    };
  } catch {
    return {
      intent: 'SALES_LEAD',
      generatedResponse: `Hello! Thank you for reaching out. A specialist will be right with you.`,
      executionTrace: ['Agent #6 fallback reply generated'],
    };
  }
}
