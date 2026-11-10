import { ZodSchema, ZodError } from 'zod';
import { callQwenJson, QwenMessage } from './qwenClient';
import { logger } from '../config/logger';

/**
 * Validates output against a Zod schema.
 * If validation fails, executes a single self-repair retry passing the Zod error back to Qwen 2.5.
 */
export async function validateWithAutoRepair<T>(
  schema: ZodSchema<T>,
  initialResult: any,
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const firstCheck = schema.safeParse(initialResult);
  if (firstCheck.success) {
    return firstCheck.data;
  }

  const zodErrorMsg = formatZodError(firstCheck.error);
  logger.warn({ error: zodErrorMsg }, 'Zod validation failed. Initiating Qwen auto-repair...');

  const repairMessages: QwenMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
    { role: 'assistant', content: JSON.stringify(initialResult) },
    {
      role: 'user',
      content: `Your previous JSON output failed validation with the following error:\n${zodErrorMsg}\n\nCorrect the JSON to strictly conform to the expected schema. Output JSON only.`,
    },
  ];

  const repairedRaw = await callQwenJson<any>(repairMessages, { temperature: 0.1 });
  const secondCheck = schema.safeParse(repairedRaw);

  if (!secondCheck.success) {
    logger.error({ error: secondCheck.error }, 'Self-repair failed to produce valid JSON');
    throw new Error(`Schema validation failed after auto-repair: ${secondCheck.error.message}`);
  }

  logger.info('✅ Auto-repair successfully healed the JSON output.');
  return secondCheck.data;
}

function formatZodError(error: ZodError): string {
  return error.errors.map((e) => `Path [${e.path.join('.')}]: ${e.message}`).join(', ');
}

