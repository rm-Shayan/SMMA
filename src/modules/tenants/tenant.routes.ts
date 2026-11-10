import { Router } from 'express';
import {
  handleRegisterTenant,
  handleListTenants,
  handleGetTenantById,
  handleUpdateTenant,
} from './tenant.controller';
import { requireAuth } from '../../core/middlewares/rbac.middleware';

export const tenantRouter = Router();

tenantRouter.post('/register', handleRegisterTenant);
tenantRouter.get('/', requireAuth, handleListTenants);
tenantRouter.get('/:id', requireAuth, handleGetTenantById);
tenantRouter.patch('/:id', requireAuth, handleUpdateTenant);

