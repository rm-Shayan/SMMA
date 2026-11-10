import { Router, Request, Response } from 'express';
import { logger } from '../../core/config/logger.config';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { saveCapturedLead } from '../leads/lead.service';

export const metaWebhookRouter = Router();

metaWebhookRouter.get('/meta', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'smma_secure_token')) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

metaWebhookRouter.post('/meta', async (req: Request, res: Response) => {
  res.status(200).send('EVENT_RECEIVED');
  const body = req.body;
  if (body.object !== 'page' && body.object !== 'instagram') return;

  for (const entry of body.entry || []) {
    for (const msgEvent of entry.messaging || []) {
      const senderId = msgEvent.sender?.id;
      const messageText = msgEvent.message?.text;
      const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';

      if (!senderId || !messageText) continue;

      try {
        const platform = body.object === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK';
        const aiResult = await invokeAgentEngine({
          tenantId,
          channel: platform,
          incomingMessage: messageText,
          senderId,
          targetAgent: 'DM_HANDLER',
        });

        if (aiResult.crmContactUpdates?.phone || aiResult.crmContactUpdates?.email) {
          await saveCapturedLead({
            tenantId,
            channel: platform,
            name: aiResult.crmContactUpdates.name,
            phone: aiResult.crmContactUpdates.phone,
            email: aiResult.crmContactUpdates.email,
            inquiryInterest: messageText,
            leadScore: aiResult.leadScore,
          });
        }
      } catch (err: any) {
        logger.error({ err: err.message }, 'Meta webhook processing error');
      }
    }
  }
});
