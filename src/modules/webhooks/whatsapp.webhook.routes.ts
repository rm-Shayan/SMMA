import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../core/config/logger.config';
import { env } from '../../core/config/env.config';
import { findTenantByPlatformAccount } from '../credentials/credentials.service';
import { verifyMetaSignature } from '../../core/security/signature.security';
import { enqueueWebhookJob } from '../scheduler/queue.service';

export const whatsappWebhookRouter = Router();

const seenMessageIds = new Set<string>();
function isDuplicate(messageId?: string): boolean {
  if (!messageId) return false;
  if (seenMessageIds.has(messageId)) return true;
  seenMessageIds.add(messageId);
  if (seenMessageIds.size > 5000) {
    const oldest = seenMessageIds.values().next().value;
    if (oldest) seenMessageIds.delete(oldest);
  }
  return false;
}

whatsappWebhookRouter.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || 'smma_secure_token';

  if (mode === 'subscribe' && token === expectedToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

whatsappWebhookRouter.post('/whatsapp', async (req: Request, res: Response) => {
  res.status(200).send('EVENT_RECEIVED');

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = req.headers['x-hub-signature-256'];
  if (!verifyMetaSignature(rawBody, typeof signature === 'string' ? signature : undefined)) {
    logger.warn({ ip: req.ip }, 'Rejected WhatsApp webhook with invalid signature');
    return;
  }

  const body = req.body;
  const value = body.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message || message.type !== 'text') return;
  if (isDuplicate(message.id)) return;

  const phoneNumberId = value?.metadata?.phone_number_id;
  let tenantId: string | null = null;
  if (phoneNumberId) {
    tenantId = await findTenantByPlatformAccount('whatsapp', String(phoneNumberId));
  }
  if (!tenantId) {
    const headerTenantId = req.headers['x-tenant-id'];
    if (typeof headerTenantId === 'string' && z.string().uuid().safeParse(headerTenantId).success) {
      tenantId = headerTenantId;
    }
  }
  if (!tenantId) {
    logger.warn({ phoneNumberId }, 'No tenant mapped to WhatsApp number, skipping event');
    return;
  }

  const senderPhone = message.from;
  const senderName = value?.contacts?.[0]?.profile?.name || 'Prospect';
  const messageText = message.text?.body;
  if (!senderPhone || !messageText) return;

  await enqueueWebhookJob('WHATSAPP', {
    tenantId,
    senderPhone,
    senderName,
    messageText,
    phoneNumberId: String(phoneNumberId || ''),
    messageId: message.id,
  });
});
