import { Router } from 'express';
import { handleGetAnalytics } from './analytics.controller';
import { requireAuth } from '../../core/middlewares/rbac.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get('/', handleGetAnalytics);
analyticsRouter.get('/:tenantId', handleGetAnalytics);

