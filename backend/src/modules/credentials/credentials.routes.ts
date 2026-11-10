import { Router } from 'express';
import {
  handleSaveCredentials,
  handleListCredentials,
  handleDeleteCredential,
} from './credentials.controller';
import { requireAuth } from '../../core/middlewares/rbac.middleware';

export const credentialsRouter = Router();

credentialsRouter.use(requireAuth);
credentialsRouter.post('/', handleSaveCredentials);
credentialsRouter.get('/', handleListCredentials);
credentialsRouter.delete('/:platform', handleDeleteCredential);

