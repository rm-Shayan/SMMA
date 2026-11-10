import { Router } from 'express';
import {
  handleListConversations,
  handleManualReply,
  handleToggleEscalation,
} from '../controllers/inbox.controller';
import { requireAuth } from '../middleware/rbacMiddleware';

export const inboxRouter = Router();

inboxRouter.use(requireAuth);
inboxRouter.get('/conversations', handleListConversations);
inboxRouter.post('/conversations/:id/reply', handleManualReply);
inboxRouter.patch('/conversations/:id/escalate', handleToggleEscalation);

