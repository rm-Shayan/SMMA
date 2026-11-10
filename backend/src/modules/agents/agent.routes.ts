import { Router } from 'express';
import { handleAgentChat, handleDirectAgent, handleListLeads } from './agent.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';
import { agentChatRateLimiter } from '../../core/middlewares/rate-limit.middleware';

export const agentRouter = Router();

agentRouter.use(requireAuth);
agentRouter.post('/chat', agentChatRateLimiter, requireRole(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR']), handleAgentChat);
agentRouter.post('/direct/:agentName', agentChatRateLimiter, requireRole(['SUPERADMIN', 'CLIENT_OWNER']), handleDirectAgent);
agentRouter.get('/leads', requireRole(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR']), handleListLeads);

