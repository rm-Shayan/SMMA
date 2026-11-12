import { Router } from 'express';
import {
  handleGetCreditSummary,
  handleListEmployeesCredits,
  handleDistributeCredits,
  handleAllocateTenantCredits,
} from './credits.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';

export const creditsRouter = Router();

creditsRouter.use(requireAuth);

// 1. Get Tenant Credit Pool & 50%/80% Alert Status
creditsRouter.get(
  '/',
  requireRole(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR', 'TRAINEE']),
  handleGetCreditSummary
);

// 2. List all employees and their allocated agent credits
creditsRouter.get(
  '/team',
  requireRole(['SUPERADMIN', 'CLIENT_OWNER']),
  handleListEmployeesCredits
);

// 3. Company Owner distributes credits to employees
creditsRouter.post(
  '/distribute',
  requireRole(['SUPERADMIN', 'CLIENT_OWNER']),
  handleDistributeCredits
);

// 4. SuperAdmin allocates company credits on plan purchase/top-up
creditsRouter.post(
  '/allocate-tenant',
  requireRole(['SUPERADMIN']),
  handleAllocateTenantCredits
);

