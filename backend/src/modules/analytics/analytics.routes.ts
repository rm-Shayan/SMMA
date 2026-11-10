import { Router } from 'express';
import { handleGetAnalytics } from './analytics.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.use(requireRole(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR']));
analyticsRouter.get('/', handleGetAnalytics);
analyticsRouter.get('/:tenantId', handleGetAnalytics);
