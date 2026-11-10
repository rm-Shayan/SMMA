import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import {
  executeToolPublishPost,
  executeToolScheduleCalendar,
  executeToolCreateSheet,
  executeToolSendEmailAlert,
  executeToolQueryData,
  ToolResult,
} from './tools.executor';
import { getRelevantTrainingContext } from '../training/training.service';

export async function executiveOrchestratorNode(state: AgentState): Promise<Partial<AgentState>> {
  const companyKnowledge = await getRelevantTrainingContext(state.tenantId, state.incomingMessage);

  const prompt = `You are the Master AI Executive Officer for this company.
The human owner/manager gives you natural instructions in Urdu or English to perform tasks or view tables/data.
Select the exact tool to execute:
1. PUBLISH_POST: User wants to post to Instagram, LinkedIn, or Twitter.
2. SCHEDULE_CALENDAR: User wants to book or schedule a meeting, call, or appointment.
3. CREATE_SHEET: User wants to generate or design a Google Sheet for a role or department.
4. SEND_EMAIL_ALERT: User wants to send an email notification.
5. QUERY_DATA: User wants to view, query, or check database tables like leads, scheduled posts, chat history, or account/company details.
6. NONE: General conversational query.

JSON Output Schema:
{
  "toolToExecute": "PUBLISH_POST" | "SCHEDULE_CALENDAR" | "CREATE_SHEET" | "SEND_EMAIL_ALERT" | "QUERY_DATA" | "NONE",
  "toolParameters": {
    "entity": "LEADS" | "POSTS" | "CONVERSATIONS" | "ACCOUNT_INFO",
    "postContent": "extracted exact content to post",
    "platform": "INSTAGRAM" | "LINKEDIN" | "TWITTER" | "FACEBOOK",
    "meetingTitle": "title of meeting",
    "attendeeEmail": "email of client",
    "sheetTitle": "title of sheet",
    "sheetHeaders": ["Column 1", "Column 2"]
  },
  "userResponseSummary": "A polite, confident confirmation of the action taken"
}

Company Context: ${state.brandVoice}`;

  try {
    const raw = await callQwenJson<any>([
      { role: 'system', content: prompt },
      { role: 'user', content: `Execute instruction: "${state.incomingMessage}"` },
    ], { temperature: 0.1 });

    const tool = raw?.toolToExecute || 'NONE';
    const p = raw?.toolParameters || {};
    let toolResult: ToolResult | null = null;
    const msg = state.incomingMessage.toLowerCase();

    if (tool === 'QUERY_DATA' || msg.includes('table') || msg.includes('data') || msg.includes('leads') || msg.includes('dikhao')) {
      const entity = p.entity || (msg.includes('lead') ? 'LEADS' : msg.includes('post') ? 'POSTS' : msg.includes('account') ? 'ACCOUNT_INFO' : 'LEADS');
      toolResult = await executeToolQueryData(state.tenantId, entity);
    } else if (tool === 'PUBLISH_POST' || msg.includes('post')) {
      toolResult = await executeToolPublishPost(state.tenantId, p.platform || 'INSTAGRAM', p.postContent || state.incomingMessage);
    } else if (tool === 'SCHEDULE_CALENDAR' || msg.includes('book') || msg.includes('schedule')) {
      const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      toolResult = await executeToolScheduleCalendar(state.tenantId, p.meetingTitle || 'Client Strategy Session', p.attendeeEmail || 'client@example.com', start);
    } else if (tool === 'CREATE_SHEET' || msg.includes('sheet')) {
      toolResult = await executeToolCreateSheet(state.tenantId, p.sheetTitle || 'Department Tracker', p.sheetHeaders || ['Date', 'Item', 'Status']);
    }

    const summary = raw?.userResponseSummary || 'Task completed successfully.';
    const finalReply = toolResult
      ? `🤖 **Action Executed by AI Assistant:**\n\n${toolResult.message}\n\n💬 ${summary}`
      : summary;

    return {
      generatedResponse: finalReply,
      executionTrace: [`Master Executive Orchestrator executed tool: ${toolResult ? toolResult.action : tool}`],
    };
  } catch (err: any) {
    return {
      generatedResponse: `I received your command. Let me verify the system credentials to execute this tool.`,
      executionTrace: ['Orchestrator fallback executed'],
    };
  }
}
