import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { env } from '../../core/config/env.config';
import { z } from 'zod';

const DMResponseSchema = z.object({
  intent: z.enum(['SALES_LEAD', 'SUPPORT', 'PRICING', 'BOOKING', 'SPAM']).or(z.string()),
  immediateReply: z.string().max(3000),
  extractedContact: z.object({
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  }).optional(),
  routeToDeepCloser: z.boolean().optional(),
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
    const raw = await callQwenJson<any>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.3 });

    const parsed = DMResponseSchema.safeParse(raw);
    const data = parsed.success ? parsed.data : {
      intent: 'SALES_LEAD',
      immediateReply: raw?.immediateReply || `Thanks for reaching out! How can our team assist you today?`,
      extractedContact: raw?.extractedContact || { name: null, phone: null, email: null },
      routeToDeepCloser: false,
    };

    return {
      intent: (data.intent as any) || 'SALES_LEAD',
      generatedResponse: data.immediateReply,
      crmContactUpdates: data.extractedContact as any,
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
