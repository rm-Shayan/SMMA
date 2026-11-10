import crypto from 'crypto';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';

/**
 * Verifies Meta/WhatsApp webhook payloads using X-Hub-Signature-256.
 * Returns true when no app secret is configured (local dev) to avoid breaking setups.
 */
export function verifyMetaSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): boolean {
  const secret = env.META_APP_SECRET;
  if (!secret) {
    logger.warn('META_APP_SECRET is not configured. Webhook signature verification skipped.');
    return true;
  }
  if (!rawBody || !signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.slice('sha256='.length);

  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
