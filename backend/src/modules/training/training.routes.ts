import { Router } from 'express';
import { handleUploadDoc, handleTrainIntern, handleListSessions } from './training.controller';
import { requireAuth } from '../../core/middlewares/rbac.middleware';

export const trainingRouter = Router();

trainingRouter.use(requireAuth);
trainingRouter.post('/docs', handleUploadDoc);
trainingRouter.post('/ask', handleTrainIntern);
trainingRouter.get('/sessions', handleListSessions);

