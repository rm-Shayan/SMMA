import { AgentState } from '../state/agentState';
import { callQwenJson } from '../../ai/qwenClient';

/**
 * Agent #1: Self-Comment Agent
 */
export async function selfCommentNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #1: Self-Comment Agent.
Generate a high-value, authentic first comment on the following post to boost algorithmic engagement.
Brand Voice: ${state.brandVoice}
Post Context: "${state.incomingMessage}"
Output JSON: { "commentText": "...", "delaySeconds": 60 }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  return {
    generatedResponse: res.commentText || 'Check out our link in bio for the full walkthrough!',
    executionTrace: ['Agent #1 (Self-Comment) generated engagement comment'],
  };
}

/**
 * Agent #5: Daily Trend & Need Identifier Agent
 */
export async function trendPlannerNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #5: Daily Trend & Need Identifier.
Identify a high-converting post idea across 4 pillars (Educational, Promotional, Social Proof, Interactive).
Brand Voice: ${state.brandVoice}
Industry Niche: "${state.incomingMessage}"
Output JSON: { "coreTopic": "...", "suggestedHook": "...", "pillar": "EDUCATIONAL" }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.4 });
  return {
    generatedResponse: JSON.stringify(res),
    executionTrace: ['Agent #5 (Trend Planner) created daily content concept'],
  };
}

/**
 * Agent #8: Post Publisher & Targeted Push Agent
 */
export async function publisherNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #8: Post Publisher & Formatter.
Format the following draft for ${state.channel} with appropriate line breaks and 3-5 targeted hashtags.
Brand Voice: ${state.brandVoice}
Draft: "${state.incomingMessage}"
Output JSON: { "formattedCaption": "...", "hashtags": ["#marketing", "#ai"] }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  const caption = res?.formattedCaption || res?.caption || res?.content || state.incomingMessage;
  return {
    generatedResponse: caption,
    executionTrace: [`Agent #8 (Publisher) formatted post for ${state.channel}`],
  };
}

