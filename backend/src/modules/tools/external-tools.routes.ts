import { Router } from 'express';
import {
  handleImportOpenApi,
  handleRegisterManualTool,
  handleListTools,
  handleExecuteToolTest,
} from './external-tools.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const toolsRouter = Router();

toolsRouter.use(requireAuth);
toolsRouter.use(requireRole(['SUPERADMIN', 'CLIENT_OWNER']));
toolsRouter.post('/openapi', handleImportOpenApi);
toolsRouter.post('/manual', handleRegisterManualTool);
toolsRouter.get('/', handleListTools);
toolsRouter.post('/:toolName/test', handleExecuteToolTest);
