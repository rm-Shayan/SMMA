import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { sanitizeAndScoreText } from '../../core/ai/quality.validator';

export async function selfCommentNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #1: Algorithmic Reach Booster.
Your job: Write a compelling first comment on our brand's post that sparks debate, adds immediate value, or directs to a free resource.
Brand Voice: ${state.brandVoice}
Post Content: "${state.incomingMessage}"

Strict Rules:
- Never say "Great post!", "Check this out!", or generic bot spam.
- Write 1-2 punchy sentences that invite replies from the audience.
Output JSON: { "commentText": "...", "delaySeconds": 60 }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  const rawComment = res?.commentText || 'Curious to hear how other agency owners are tackling this issue in their workflow!';
  const qResult = sanitizeAndScoreText(rawComment, state.channel);

  return {
    generatedResponse: qResult.cleanedText,
    executionTrace: [`Agent #1 (Self-Comment) quality score: ${qResult.score}/100`],
  };
}

export async function trendPlannerNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #2: Viral Trend & Market Need Architect.
Analyze the target industry niche and craft 1 viral hook idea that directly targets business owners' biggest pain point.
Brand Voice: ${state.brandVoice}
Industry Niche Context: "${state.incomingMessage}"

Strict Rules:
- Avoid buzzwords like "game-changer", "revolutionary", "delve".
- Make the hook polarizing or insight-driven.
Output JSON: { "coreTopic": "...", "suggestedHook": "...", "pillar": "EDUCATIONAL" | "SOCIAL_PROOF" | "PROMOTIONAL" }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.35 });
  return {
    generatedResponse: JSON.stringify(res),
    executionTrace: ['Agent #2 (Trend Planner) created validated content concept'],
  };
}

export async function publisherNode(state: AgentState): Promise<Partial<AgentState>> {
  const channel = state.channel.toUpperCase();
  const prompt = `You are Agent #4: Omnichannel Content Distribution Specialist.
Adapt this raw draft for ${channel}.
Brand Voice: ${state.brandVoice}
Raw Draft: "${state.incomingMessage}"

Platform Specific Constraints:
- TWITTER/X: Strictly under 270 characters, 1-2 hashtags max.
- LINKEDIN: Professional storytelling spacing, bold takeaway, 3 niche hashtags.
- INSTAGRAM: Strong first line hook before fold, spacing, 5 targeted hashtags.
Output JSON: { "formattedCaption": "...", "hashtags": ["#tag1", "#tag2"] }`;

  const res = await callQwenJson<any>([{ role: 'system', content: prompt }], { temperature: 0.3 });
  const rawCaption = res?.formattedCaption || res?.caption || res?.content || state.incomingMessage;
  const qResult = sanitizeAndScoreText(rawCaption, channel);

  return {
    generatedResponse: qResult.cleanedText,
    executionTrace: [`Agent #4 (Publisher) formatted for ${channel}. Quality: ${qResult.score}/100`],
  };
}
