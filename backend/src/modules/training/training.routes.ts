import { Router } from 'express';
import { handleUploadDoc, handleTrainIntern, handleListSessions } from './training.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';
import { trainingAskRateLimiter } from '../../core/middlewares/rate-limit.middleware';

export const trainingRouter = Router();

trainingRouter.use(requireAuth);
trainingRouter.post('/docs', requireRole(['SUPERADMIN', 'CLIENT_OWNER']), handleUploadDoc);
trainingRouter.post('/ask', trainingAskRateLimiter, requireRole(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR', 'TRAINEE']), handleTrainIntern);
trainingRouter.get('/sessions', requireRole(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR', 'TRAINEE']), handleListSessions);
