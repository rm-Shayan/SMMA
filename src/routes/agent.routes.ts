import { Router } from 'express';
import { handleAgentChat, handleDirectAgent, handleListLeads } from '../controllers/agent.controller';

export const agentRouter = Router();

// Universal Agent Chat & Triage (Interconnected Flow via Supervisor)
agentRouter.post('/chat', handleAgentChat);

// Direct Single-Agent Execution (Bypasses Supervisor directly)
agentRouter.post('/direct/:agentName', handleDirectAgent);

// View Captured Leads Table (For Boss / Agency CRM)
agentRouter.get('/leads', handleListLeads);
