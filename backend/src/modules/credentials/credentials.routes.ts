import { Router } from 'express';
import {
  handleSaveCredentials,
  handleListCredentials,
  handleDeleteCredential,
} from './credentials.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const credentialsRouter = Router();

credentialsRouter.use(requireAuth);
credentialsRouter.use(requireRole(['SUPERADMIN', 'CLIENT_OWNER']));
credentialsRouter.post('/', handleSaveCredentials);
credentialsRouter.get('/', handleListCredentials);
credentialsRouter.delete('/:platform', handleDeleteCredential);
