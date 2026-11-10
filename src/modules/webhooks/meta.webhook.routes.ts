import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../core/config/logger.config';
import { env } from '../../core/config/env.config';
import { findTenantByPlatformAccount } from '../credentials/credentials.service';
import { verifyMetaSignature } from '../../core/security/signature.security';
import { enqueueWebhookJob } from '../scheduler/queue.service';

export const metaWebhookRouter = Router();

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

function resolveTenantFromHeader(req: Request): string | null {
  const headerTenantId = req.headers['x-tenant-id'];
  if (typeof headerTenantId === 'string' && z.string().uuid().safeParse(headerTenantId).success) {
    return headerTenantId;
  }
  return null;
}

metaWebhookRouter.get('/meta', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = env.META_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN || 'smma_secure_token';

  if (mode === 'subscribe' && token === expectedToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

metaWebhookRouter.post('/meta', async (req: Request, res: Response) => {
  res.status(200).send('EVENT_RECEIVED');

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = req.headers['x-hub-signature-256'];
  if (!verifyMetaSignature(rawBody, typeof signature === 'string' ? signature : undefined)) {
    logger.warn({ ip: req.ip }, 'Rejected Meta webhook with invalid signature');
    return;
  }

  const body = req.body;
  if (body.object !== 'page' && body.object !== 'instagram') return;

  const platform = body.object === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK';

  for (const entry of body.entry || []) {
    let tenantId: string | null = null;
    if (entry.id) {
      tenantId = await findTenantByPlatformAccount(platform.toLowerCase(), String(entry.id));
    }
    if (!tenantId) {
      tenantId = resolveTenantFromHeader(req);
    }
    if (!tenantId) {
      logger.warn({ platform, accountId: entry.id }, 'No tenant mapped to Meta account, skipping event');
      continue;
    }

    for (const msgEvent of entry.messaging || []) {
      const senderId = msgEvent.sender?.id;
      const messageText = msgEvent.message?.text;
      const messageId = msgEvent.message?.mid;

      if (!senderId || !messageText) continue;
      if (msgEvent.message?.is_echo) continue;
      if (isDuplicate(messageId)) continue;

      await enqueueWebhookJob('META', {
        platform,
        tenantId,
        senderId: String(senderId),
        messageText,
        messageId,
      });
    }
  }
});
