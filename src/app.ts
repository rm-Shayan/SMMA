import express, { Request, Response, NextFunction } from 'express';
import { logger } from './config/logger';
import { tenantContextMiddleware } from './middleware/tenantContext';
import { agentRouter } from './routes/agent.routes';
import { postRouter } from './routes/post.routes';
import { tenantRouter } from './routes/tenant.routes';
import { authRouter } from './routes/auth.routes';
import { credentialsRouter } from './routes/credentials.routes';
import { inboxRouter } from './routes/inbox.routes';
import { metaWebhookRouter } from './routes/webhooks/meta.routes';
import { whatsappWebhookRouter } from './routes/webhooks/whatsapp.routes';

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(tenantContextMiddleware);

// Universal Headless Agent Ingress API
app.use('/api/v1/agents', agentRouter);

// Multi-Platform Post Publishing API (LinkedIn, X, Instagram, Facebook)
app.use('/api/v1/posts', postRouter);

// Tenant Onboarding & Registration API
app.use('/api/v1/tenants', tenantRouter);

// Authentication & Platform RBAC API
app.use('/api/v1/auth', authRouter);

// Connected Social Media Accounts Credentials API
app.use('/api/v1/credentials', credentialsRouter);

// Unified Multi-Platform Inbox API
app.use('/api/v1/inbox', inboxRouter);

// Inbound Social Webhook Listeners
app.use('/webhooks', metaWebhookRouter);
app.use('/webhooks', whatsappWebhookRouter);

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled application error');
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});
