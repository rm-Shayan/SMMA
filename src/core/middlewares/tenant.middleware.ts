import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

const uuidSchema = z.string().uuid();

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerTenantId = req.headers['x-tenant-id'];

  if (!headerTenantId) {
    return next();
  }

  const result = uuidSchema.safeParse(headerTenantId);
  if (!result.success) {
    res.status(400).json({
      error: 'Invalid Tenant ID',
      message: 'x-tenant-id header must be a valid UUID v4',
    });
    return;
  }

  req.tenantId = result.data;
  next();
}
