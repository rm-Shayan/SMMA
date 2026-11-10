import { Router } from 'express';
import { handleAgentChat, handleDirectAgent, handleListLeads } from './agent.controller';

export const agentRouter = Router();

agentRouter.post('/chat', handleAgentChat);
agentRouter.post('/direct/:agentName', handleDirectAgent);
agentRouter.get('/leads', handleListLeads);
