import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentState } from './agent.state';
import { supervisorNode } from './supervisor.node';
import { inboundDmNode } from './inbound-dm.node';
import { supportCloserNode } from './support-closer.node';
import { selfCommentNode, trendPlannerNode, publisherNode } from './content.nodes';
import { researcherNode, commentReplyNode, analyticsNode, competitorBotNode } from './research.nodes';
import { internTrainingMentorNode } from './intern-mentor.node';
import { sheetArchitectNode } from './sheet-architect.node';
import { executiveOrchestratorNode } from './executive-orchestrator.node';
import { getTenantIntegrations } from '../tenants/tenant.service';

function buildStateGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('supervisor', supervisorNode)
    .addNode('orchestrator', executiveOrchestratorNode)
    .addNode('inbound_dm', inboundDmNode)
    .addNode('support_closer', supportCloserNode)
    .addNode('self_comment', selfCommentNode)
    .addNode('trend_planner', trendPlannerNode)
    .addNode('publisher', publisherNode)
    .addNode('researcher', researcherNode)
    .addNode('comment_reply', commentReplyNode)
    .addNode('analytics', analyticsNode)
    .addNode('competitor_bot', competitorBotNode)
    .addNode('intern_mentor', internTrainingMentorNode)
    .addNode('sheet_architect', sheetArchitectNode)

    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', (state: AgentState) => {
      switch (state.targetAgent) {
        case 'EXECUTIVE_ORCHESTRATOR':
          return 'orchestrator';
        case 'SHEET_ARCHITECT':
          return 'sheet_architect';
        case 'INTERN_TRAINER':
          return 'intern_mentor';
        case 'DM_HANDLER':
          return 'inbound_dm';
        case 'INBOX_SUPPORT_MANAGER':
          return 'support_closer';
        case 'SELF_COMMENTER':
          return 'self_comment';
        case 'TREND_IDENTIFIER':
          return 'trend_planner';
        case 'POST_DISTRIBUTION':
          return 'publisher';
        case 'COMPETITIVE_RESEARCHER':
          return 'researcher';
        case 'COMMENT_REPLY':
          return 'comment_reply';
        case 'ANALYTICS':
          return 'analytics';
        case 'COMPETITOR_ENGAGEMENT':
          return 'competitor_bot';
        default:
          return 'orchestrator';
      }
    })
    .addEdge('orchestrator', END)
    .addEdge('inbound_dm', END)
    .addEdge('support_closer', END)
    .addEdge('self_comment', END)
    .addEdge('trend_planner', END)
    .addEdge('publisher', END)
    .addEdge('researcher', END)
    .addEdge('comment_reply', END)
    .addEdge('analytics', END)
    .addEdge('competitor_bot', END)
    .addEdge('intern_mentor', END)
    .addEdge('sheet_architect', END);

  return workflow.compile();
}

export const agentRunner = buildStateGraph();

export async function invokeAgentEngine(input: any): Promise<AgentState> {
  const integrations = input.tenantId ? await getTenantIntegrations(input.tenantId) : null;

  if (integrations && !integrations.isActive) {
    return {
      tenantId: input.tenantId,
      channel: input.channel || 'CRM_LIVE_CHAT',
      targetAgent: input.targetAgent || '',
      generatedResponse: '',
      requiresHumanReview: true,
      executionTrace: ['Tenant is inactive. AI execution blocked.'],
    } as AgentState;
  }

  const rawHistory = Array.isArray(input.conversationHistory) ? input.conversationHistory : [];
  const boundedHistory = rawHistory.slice(-6).map((msg: any) => ({
    role: msg.role || 'user',
    content: typeof msg.content === 'string' ? msg.content.slice(0, 400) : String(msg.content || ''),
  }));

  const normalizedInput = {
    ...input,
    actor: input.actor || null,
    incomingMessage: input.incomingMessage || input.message || '',
    brandVoice: input.brandVoice || integrations?.brandVoice || 'Professional, authoritative, high-conversion',
    channel: input.channel || 'CRM_LIVE_CHAT',
    contact: input.contact || { name: input.senderId || 'Trainee' },
    bookingCalendarUrl: input.bookingCalendarUrl || integrations?.bookingCalendarUrl || '',
    conversationHistory: boundedHistory,
  };
  const finalState = await agentRunner.invoke(normalizedInput as any);
  return finalState;
}
