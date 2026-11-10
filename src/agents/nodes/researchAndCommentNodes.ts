import { AgentState } from '../state/agentState';
import { callQwenJson } from '../../ai/qwenClient';

/**
 * Agent #2: Market Competitive Researcher Agent
 */
export async function researcherNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #2: Market Competitive Researcher.
Analyze industry discussion gaps and output actionable positioning angles for: "${state.incomingMessage}".
Output JSON: { "trendingTopics": ["..."], "contentGapOpportunities": ["..."], "recommendedFormat": "CAROUSEL" }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  return {
    generatedResponse: JSON.stringify(res),
    executionTrace: ['Agent #2 (Researcher) identified positioning opportunities'],
  };
}

/**
 * Agent #3: Comment Reply Agent
 */
export async function commentReplyNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #3: Comment Reply Agent.
Write a brand-aligned, intelligent response to this public user comment: "${state.incomingMessage}".
Brand Voice: ${state.brandVoice}
If the comment is an inquiry, invite them to send a DM.
Output JSON: { "replyText": "...", "sentiment": "POSITIVE", "triggerPrivateDM": false }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  return {
    generatedResponse: res.replyText || 'Thanks for sharing your thoughts!',
    executionTrace: ['Agent #3 (Comment Reply) generated public reply'],
  };
}

/**
 * Agent #4: Analytics & Tracking Agent
 */
export async function analyticsNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #4: Analytics & Tracking Agent.
Summarize weekly metrics and provide 3 key growth recommendations for the client.
Data Summary: "${state.incomingMessage}"
Output JSON: { "averageEngagementRate": 4.5, "recommendations": ["..."] }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.2 });
  return {
    generatedResponse: JSON.stringify(res),
    executionTrace: ['Agent #4 (Analytics) generated performance insights'],
  };
}

/**
 * Agent #7: Competitor Engagement Bot
 */
export async function competitorBotNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #7: Competitor Engagement Bot.
Draft a high-authority, value-add comment under an industry thought-leader post: "${state.incomingMessage}".
Never criticize. Always provide perspective.
Output JSON: { "commentDraft": "...", "valueAngle": "...", "requiresHumanReview": true }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  return {
    generatedResponse: res.commentDraft || 'Great breakdown!',
    requiresHumanReview: true,
    executionTrace: ['Agent #7 (Competitor Bot) drafted authority comment'],
  };
}

