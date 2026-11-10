import { Router } from 'express';
import { handleSchedulePost } from './scheduler.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const schedulerRouter = Router();

schedulerRouter.use(requireAuth);
schedulerRouter.use(requireRole(['SUPERADMIN', 'CLIENT_OWNER']));
schedulerRouter.post('/publish', handleSchedulePost);
