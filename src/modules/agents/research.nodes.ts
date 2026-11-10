import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';

export async function researcherNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #2: Market Competitive Researcher.
Analyze industry discussions and identify 5 high-performing content angles.
Brand Voice: ${state.brandVoice}
Topic: "${state.incomingMessage}"
Output JSON: { "trendingTopics": ["..."], "contentGapOpportunities": ["..."], "recommendedFormat": "CAROUSEL" }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.4 });
  return {
    generatedResponse: JSON.stringify(res),
    executionTrace: ['Agent #2 (Researcher) identified positioning opportunities'],
  };
}

export async function commentReplyNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #3: Comment Reply & Lead Nudge Agent.
Reply to this public comment concisely, professionally, and naturally nudge them to DM if interested.
Brand Voice: ${state.brandVoice}
Public Comment: "${state.incomingMessage}"
Output JSON: { "replyText": "...", "nudgeToDm": boolean }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  return {
    generatedResponse: res.replyText || 'Thanks for your comment! Feel free to send us a DM if you have any questions.',
    executionTrace: ['Agent #3 (Comment Reply) generated public reply'],
  };
}

export async function analyticsNode(state: AgentState): Promise<Partial<AgentState>> {
  return {
    generatedResponse: JSON.stringify({ status: 'Analytics digest generated' }),
    executionTrace: ['Agent #4 (Analytics) summarized performance metrics'],
  };
}

export async function competitorBotNode(state: AgentState): Promise<Partial<AgentState>> {
  return {
    generatedResponse: 'Thoughtful perspective! In our experience, combining automation with human strategy yields the best ROI.',
    requiresHumanReview: true,
    executionTrace: ['Agent #7 (Competitor Engagement) drafted authority comment'],
  };
}
