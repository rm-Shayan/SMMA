import { Router, Request, Response } from 'express';
import { logger } from '../../core/config/logger.config';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { saveCapturedLead } from '../leads/lead.service';

export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'smma_secure_token')) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

whatsappWebhookRouter.post('/whatsapp', async (req: Request, res: Response) => {
  res.status(200).send('EVENT_RECEIVED');
  const body = req.body;
  const changes = body.entry?.[0]?.changes?.[0]?.value;
  const message = changes?.messages?.[0];
  if (!message || message.type !== 'text') return;

  const senderPhone = message.from;
  const senderName = changes.contacts?.[0]?.profile?.name || 'Prospect';
  const messageText = message.text?.body;
  const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';

  try {
    const aiResult = await invokeAgentEngine({
      tenantId,
      channel: 'WHATSAPP',
      incomingMessage: messageText,
      senderId: senderPhone,
      targetAgent: 'DM_HANDLER',
    });

    if (aiResult.crmContactUpdates?.phone || aiResult.crmContactUpdates?.email || senderPhone) {
      await saveCapturedLead({
        tenantId,
        channel: 'WHATSAPP',
        name: aiResult.crmContactUpdates?.name || senderName,
        phone: aiResult.crmContactUpdates?.phone || senderPhone,
        email: aiResult.crmContactUpdates?.email,
        inquiryInterest: messageText,
        leadScore: aiResult.leadScore,
      });
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'WhatsApp webhook processing error');
  }
});
