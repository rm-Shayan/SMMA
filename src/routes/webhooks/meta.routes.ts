import { Router, Request, Response } from 'express';
import { invokeAgentEngine } from '../../agents/agentWorkflow';
import { sendMetaDm } from '../../services/social/metaService';
import { logger } from '../../config/logger';

export const metaWebhookRouter = Router();

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'smma_secure_verify_token_2026';

/**
 * Meta Webhook Verification Endpoint (Required by Meta App Dashboard)
 */
metaWebhookRouter.get('/meta', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    logger.info('✅ Meta Webhook successfully verified by Meta servers.');
    res.status(200).send(challenge);
  } else {
    logger.warn({ token }, 'Meta Webhook verification token mismatch');
    res.sendStatus(403);
  }
});

/**
 * Meta Inbound Webhook Ingestion (Instagram DMs, IG Comments, FB Messenger)
 */
metaWebhookRouter.post('/meta', async (req: Request, res: Response) => {
  // Always acknowledge immediately within 200ms to prevent Meta retries
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  if (body.object !== 'instagram' && body.object !== 'page') {
    return;
  }

  const entries = body.entry || [];
  for (const entry of entries) {
    const messaging = entry.messaging || [];
    for (const msg of messaging) {
      const senderId = msg.sender?.id;
      const text = msg.message?.text;

      // Drop self-replies or empty payloads
      if (!senderId || !text || msg.message?.is_echo) continue;

      const isInstagram = body.object === 'instagram';
      logger.info({ senderId, isInstagram, text }, 'Inbound Meta message received');

      try {
        const finalState = await invokeAgentEngine({
          channel: isInstagram ? 'INSTAGRAM' : 'FACEBOOK',
          incomingMessage: text,
          contact: { id: senderId },
        });

        if (finalState.generatedResponse) {
          logger.info({ response: finalState.generatedResponse }, 'Agent generated reply for Meta DM');
          // In production with connected page token:
          // await sendMetaDm({ pageAccessToken, recipientId: senderId, text: finalState.generatedResponse, platform: isInstagram ? 'INSTAGRAM' : 'FACEBOOK' });
        }
      } catch (err: any) {
        logger.error({ err: err.message }, 'Failed to process Meta webhook event');
      }
    }
  }
});

