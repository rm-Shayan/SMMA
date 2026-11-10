import { Router } from 'express';
import { handleSchedulePost } from './scheduler.controller';
import { requireAuth } from '../../core/middlewares/rbac.middleware';

export const schedulerRouter = Router();

schedulerRouter.use(requireAuth);
schedulerRouter.post('/publish', handleSchedulePost);
