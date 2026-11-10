import { Router } from 'express';
import {
  handleSaveCredentials,
  handleListCredentials,
  handleDeleteCredential,
} from '../controllers/credentials.controller';
import { requireAuth } from '../middleware/rbacMiddleware';

export const credentialsRouter = Router();

credentialsRouter.use(requireAuth);
credentialsRouter.post('/', handleSaveCredentials);
credentialsRouter.get('/', handleListCredentials);
credentialsRouter.delete('/:platform', handleDeleteCredential);

