import { Router } from 'express';
import {
  handleListConversations,
  handleManualReply,
  handleToggleEscalation,
} from './inbox.controller';
import { requireAuth } from '../../core/middlewares/rbac.middleware';

export const inboxRouter = Router();

inboxRouter.use(requireAuth);
inboxRouter.get('/conversations', handleListConversations);
inboxRouter.post('/conversations/:id/reply', handleManualReply);
inboxRouter.patch('/conversations/:id/escalate', handleToggleEscalation);
