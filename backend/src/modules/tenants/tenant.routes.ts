import { Router } from 'express';
import {
  handleRegisterTenant,
  handleListTenants,
  handleGetTenantById,
  handleUpdateTenant,
} from './tenant.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const tenantRouter = Router();

tenantRouter.post('/register', handleRegisterTenant);
tenantRouter.get('/', requireAuth, requireRole(['SUPERADMIN','CLIENT_OWNER','AGENT_OPERATOR']), handleListTenants);
tenantRouter.get('/:id', requireAuth, requireRole(['SUPERADMIN','CLIENT_OWNER','AGENT_OPERATOR']), handleGetTenantById);
tenantRouter.patch('/:id', requireAuth, requireRole(['SUPERADMIN','CLIENT_OWNER']), handleUpdateTenant);
