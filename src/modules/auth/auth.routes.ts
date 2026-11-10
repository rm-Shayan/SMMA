import { Router } from 'express';
import { handleLogin, handleCreateUser, handleGetMe } from './auth.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const authRouter = Router();

authRouter.post('/login', handleLogin);
authRouter.post('/create-user', requireAuth, requireRole(['SUPERADMIN', 'CLIENT_OWNER']), handleCreateUser);
authRouter.get('/me', requireAuth, handleGetMe);
