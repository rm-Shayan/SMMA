import { Router } from 'express';
import {
  handleListConversations,
  handleManualReply,
  handleToggleEscalation,
} from './inbox.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const inboxRouter = Router();

inboxRouter.use(requireAuth);
inboxRouter.get('/conversations', requireRole(['SUPERADMIN','CLIENT_OWNER','AGENT_OPERATOR']), handleListConversations);
inboxRouter.post('/conversations/:id/reply', requireRole(['SUPERADMIN','CLIENT_OWNER','AGENT_OPERATOR']), handleManualReply);
inboxRouter.patch('/conversations/:id/escalate', requireRole(['SUPERADMIN','CLIENT_OWNER']), handleToggleEscalation);
