import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentState } from './agent.state';
import { supervisorNode } from './supervisor.node';
import { inboundDmNode } from './inbound-dm.node';
import { supportCloserNode } from './support-closer.node';
import { selfCommentNode, trendPlannerNode, publisherNode } from './content.nodes';
import { researcherNode, commentReplyNode, analyticsNode, competitorBotNode } from './research.nodes';
import { getTenantIntegrations } from '../tenants/tenant.service';

function buildStateGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('supervisor', supervisorNode)
    .addNode('inbound_dm', inboundDmNode)
    .addNode('support_closer', supportCloserNode)
    .addNode('self_comment', selfCommentNode)
    .addNode('trend_planner', trendPlannerNode)
    .addNode('publisher', publisherNode)
    .addNode('researcher', researcherNode)
    .addNode('comment_reply', commentReplyNode)
    .addNode('analytics', analyticsNode)
    .addNode('competitor_bot', competitorBotNode)

    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', (state: AgentState) => {
      switch (state.targetAgent) {
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
          return 'support_closer';
      }
    })
    .addEdge('inbound_dm', END)
    .addEdge('support_closer', END)
    .addEdge('self_comment', END)
    .addEdge('trend_planner', END)
    .addEdge('publisher', END)
    .addEdge('researcher', END)
    .addEdge('comment_reply', END)
    .addEdge('analytics', END)
    .addEdge('competitor_bot', END);

  return workflow.compile();
}

export const agentRunner = buildStateGraph();

export async function invokeAgentEngine(input: any): Promise<AgentState> {
  let bookingCalendarUrl = input.bookingCalendarUrl;
  if (!bookingCalendarUrl && input.tenantId) {
    const integrations = await getTenantIntegrations(input.tenantId);
    bookingCalendarUrl = integrations.bookingCalendarUrl;
  }

  const normalizedInput = {
    ...input,
    incomingMessage: input.incomingMessage || input.message || '',
    brandVoice: input.brandVoice || 'Professional, authoritative, high-conversion',
    channel: input.channel || 'CRM_LIVE_CHAT',
    bookingCalendarUrl: bookingCalendarUrl || '',
  };
  const finalState = await agentRunner.invoke(normalizedInput as any);
  return finalState;
}
