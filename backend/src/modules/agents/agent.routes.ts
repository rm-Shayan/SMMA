import { Router } from 'express';
import { handleAgentChat, handleDirectAgent, handleListLeads } from './agent.controller';
import { requireAuth } from '../../core/middlewares/rbac.middleware';

export const agentRouter = Router();

agentRouter.use(requireAuth);
agentRouter.post('/chat', handleAgentChat);
agentRouter.post('/direct/:agentName', handleDirectAgent);
agentRouter.get('/leads', handleListLeads);

