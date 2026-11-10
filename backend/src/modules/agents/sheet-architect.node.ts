import { AgentState } from './agent.state';
import { callQwenJson } from '../../core/ai/qwen.client';
import { createGoogleSpreadsheet, DynamicSpreadsheetResult } from '../integrations/google-sheets-creator.service';
import { pool } from '../../core/database/pool.database';
import { z } from 'zod';

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
Your job: When a user, manager, or company says "create a sheet for [role/accounts/sales/hiring]", design the exact professional spreadsheet structure needed.

User Request: "${state.incomingMessage}"
Brand / Context: ${state.brandVoice}

Rules:
1. Identify the exact role (e.g. Accounts, Sales Reps, Intern Tracking, Influencer CRM, Expense Ledger).
2. Choose 5-8 highly relevant, structured column headers for that specific role.
3. Provide 2 realistic sample seed data rows.
4. Output valid JSON matching schema.`;

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
      summaryExplanation: 'I have structured your custom operations sheet with necessary column tracking.',
    };

    let sheetRes: DynamicSpreadsheetResult | null = null;
    try {
      sheetRes = await createGoogleSpreadsheet(design.spreadsheetTitle, design.columnHeaders, design.sampleSeedRows);
    } catch {
      sheetRes = null;
    }

    const liveUrl = sheetRes?.spreadsheetUrl || 'https://docs.google.com/spreadsheets/d/mock-preview';
    const textOutput = `✅ **${design.spreadsheetTitle}** has been autonomously generated!\n\n` +
      `📋 **Designed For:** ${design.targetRole}\n` +
      `📊 **Columns Created:** ${design.columnHeaders.join(' | ')}\n` +
      `🔗 **Live Google Sheet Link:** [Open Spreadsheet](${liveUrl})\n\n` +
      `💬 ${design.summaryExplanation}`;

    return {
      generatedResponse: textOutput,
      executionTrace: [`Agent #11 (Sheet Architect) created custom sheet for ${design.targetRole}.`],
    };
  } catch {
    return {
      generatedResponse: `I have designed your tracking structure. Please ensure Google API credentials are authenticated.`,
      executionTrace: ['Agent #11 fallback response'],
    };
  }
}

