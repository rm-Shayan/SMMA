import { Router } from 'express';
import {
  handleRegisterTenant,
  handleListTenants,
  handleGetTenantById,
  handleUpdateTenant,
  handleDeleteTenant,
} from '../controllers/tenant.controller';
import { requireAuth, requireRole } from '../middleware/rbacMiddleware';

export const tenantRouter = Router();

// Public registration
tenantRouter.post('/register', handleRegisterTenant);

// Authenticated CRUD endpoints
tenantRouter.get('/', requireAuth, handleListTenants);
tenantRouter.get('/:id', requireAuth, handleGetTenantById);
tenantRouter.patch('/:id', requireAuth, handleUpdateTenant);
tenantRouter.delete('/:id', requireAuth, requireRole(['SUPERADMIN']), handleDeleteTenant);
