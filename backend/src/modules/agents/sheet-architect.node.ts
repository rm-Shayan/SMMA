import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { z } from 'zod';
import { authorizeAndExecuteProposedTool } from './agent.policy';

const SheetArchitectSchema = z.object({
  isSheetCreationRequest: z.boolean(),
  spreadsheetTitle: z.string().default('New Operations Tracking Sheet'),
  targetRole: z.string().default('General Operations'),
  columnHeaders: z.array(z.string()).min(2),
  sampleSeedRows: z.array(z.array(z.string().or(z.number()))).default([]),
  summaryExplanation: z.string(),
});

export async function sheetArchitectNode(state: AgentState): Promise<Partial<AgentState>> {
  const prompt = `You are Agent #11: Autonomous Sheet & Workflow Operations Architect.
Design a spreadsheet structure. You may propose creation; the system will authorize it.
User Request: "${state.incomingMessage}"
Brand / Context: ${state.brandVoice}
Return valid JSON with spreadsheetTitle, targetRole, columnHeaders (5-8), sampleSeedRows, summaryExplanation, isSheetCreationRequest.`;

  try {
    const raw = await callQwenJson<any>([
      { role: 'system', content: prompt },
      { role: 'user', content: `Design and structure the sheet: "${state.incomingMessage}"` },
    ], { temperature: 0.2 });

    const parsed = SheetArchitectSchema.safeParse(raw);
    const design = parsed.success ? parsed.data : {
      isSheetCreationRequest: true,
      spreadsheetTitle: 'Operations & Workflow Tracker',
      targetRole: 'Operations',
      columnHeaders: ['Date', 'Item Description', 'Department', 'Assigned To', 'Status', 'Notes'],
      sampleSeedRows: [[new Date().toISOString().split('T')[0], 'Initial Setup', 'General', 'Operations Lead', 'ACTIVE', 'Initialized by AI']],
      summaryExplanation: 'Structured operations tracking sheet.',
    };

    const decision = await authorizeAndExecuteProposedTool(state, {
      tool: 'CREATE_SHEET',
      params: { sheetTitle: design.spreadsheetTitle, sheetHeaders: design.columnHeaders },
      summary: design.summaryExplanation,
    });

    if (decision.denied || !decision.result) {
      return {
        generatedResponse: `Sheet action denied by policy: ${decision.reason || decision.summary}`,
        executionTrace: [`Agent #11 policy denied: ${decision.reason || 'denied'}`],
      };
    }

    const url = (decision.result.data as any)?.spreadsheetUrl || 'N/A';
    return {
      generatedResponse: `Sheet created (policy-approved).\nTitle: ${design.spreadsheetTitle}\nRole: ${design.targetRole}\nColumns: ${design.columnHeaders.join(' | ')}\nURL: ${url}\n\n${design.summaryExplanation}`,
      executionTrace: [`Agent #11 created sheet via policy gate for ${design.targetRole}.`],
    };
  } catch {
    return {
      generatedResponse: 'Sheet request could not be completed safely.',
      executionTrace: ['Agent #11 fallback'],
    };
  }
}
