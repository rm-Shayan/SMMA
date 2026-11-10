import { Router, Request, Response } from 'express';
import { invokeAgentEngine } from '../../agents/agentWorkflow';
import { logger } from '../../config/logger';

export const whatsappWebhookRouter = Router();

const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'smma_secure_verify_token_2026';

/**
 * WhatsApp Cloud API Verification Endpoint
 */
whatsappWebhookRouter.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
    logger.info('✅ WhatsApp Cloud Webhook successfully verified.');
    res.status(200).send(challenge);
  } else {
    logger.warn('WhatsApp Webhook verification token mismatch');
    res.sendStatus(403);
  }
});

/**
 * WhatsApp Inbound Customer Message Ingestion
 */
whatsappWebhookRouter.post('/whatsapp', async (req: Request, res: Response) => {
  // Always return 200 OK immediately
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const messageData = changes?.value?.messages?.[0];

  if (!messageData || messageData.type !== 'text') {
    return;
  }

  const senderPhone = messageData.from;
  const messageText = messageData.text?.body;

  if (!senderPhone || !messageText) return;

  logger.info({ senderPhone, messageText }, 'Inbound WhatsApp message received');

  try {
    const finalState = await invokeAgentEngine({
      channel: 'WHATSAPP',
      incomingMessage: messageText,
      contact: { phone: senderPhone },
    });

    if (finalState.generatedResponse) {
      logger.info({ reply: finalState.generatedResponse }, 'Agent generated reply for WhatsApp');
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to process WhatsApp message');
  }
});

