import { Router } from 'express';
import {
  handleRegisterTenant,
  handleListTenants,
  handleGetTenantById,
  handleUpdateTenant,
} from './tenant.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const tenantRouter = Router();

// Registration locked to SUPERADMIN (internal/provisioned onboarding). Public self-signup disabled.
tenantRouter.post('/register', requireAuth, requireRole(['SUPERADMIN']), handleRegisterTenant);
tenantRouter.get('/', requireAuth, requireRole(['SUPERADMIN','CLIENT_OWNER','AGENT_OPERATOR']), handleListTenants);
tenantRouter.get('/:id', requireAuth, requireRole(['SUPERADMIN','CLIENT_OWNER','AGENT_OPERATOR']), handleGetTenantById);
tenantRouter.patch('/:id', requireAuth, requireRole(['SUPERADMIN','CLIENT_OWNER']), handleUpdateTenant);
