import { z } from 'zod';
import { logger } from '../config/logger.config';

/**
 * Validates untrusted model outputs against a Zod schema with error recovery.
 */
export function validateWithAutoRepair<T>(
  schema: z.ZodSchema<T>,
  rawJson: any,
  fallbackValue: T
): { data: T; wasRepaired: boolean; errors?: string[] } {
  const result = schema.safeParse(rawJson);

  if (result.success) {
    return { data: result.data, wasRepaired: false };
  }

  const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  logger.warn({ errors: errorMessages, rawJson }, 'Schema validation failed. Applying fallback.');

  return {
    data: fallbackValue,
    wasRepaired: true,
    errors: errorMessages,
  };
}

