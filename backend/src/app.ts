import express, { Request, Response } from 'express';
import { tenantMiddleware } from './core/middlewares/tenant.middleware';
import { errorHandler, notFoundHandler } from './core/middlewares/error.middleware';
import { globalApiRateLimit, requireIdempotencyKeyForWrites } from './core/middlewares/request-control.middleware';

import { authRouter } from './modules/auth/auth.routes';
import { tenantRouter } from './modules/tenants/tenant.routes';
import { agentRouter } from './modules/agents/agent.routes';
import { schedulerRouter } from './modules/scheduler/scheduler.routes';
import { credentialsRouter } from './modules/credentials/credentials.routes';
import { inboxRouter } from './modules/inbox/inbox.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { trainingRouter } from './modules/training/training.routes';
import { toolsRouter } from './modules/tools/external-tools.routes';
import { approvalsRouter } from './modules/agents/approvals.routes';
import { metaWebhookRouter } from './modules/webhooks/meta.webhook.routes';
import { whatsappWebhookRouter } from './modules/webhooks/whatsapp.webhook.routes';

export const app = express();

app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-tenant-id, Idempotency-Key, x-idempotency-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({
  limit: '10mb',
  verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(requireIdempotencyKeyForWrites);
app.use(tenantMiddleware);
app.use('/api', globalApiRateLimit({ windowMs: 60_000, max: 180 }));

// Feature Modules Mounting
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tenants', tenantRouter);
app.use('/api/v1/agents', agentRouter);
app.use('/api/v1/posts', schedulerRouter);
app.use('/api/v1/credentials', credentialsRouter);
app.use('/api/v1/inbox', inboxRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/training', trainingRouter);
app.use('/api/v1/tools', toolsRouter);
app.use('/api/v1/approvals', approvalsRouter);

// Social Inbound Webhooks
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

// Global Error & 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);
