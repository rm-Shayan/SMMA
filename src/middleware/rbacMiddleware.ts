import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, TokenPayload } from '../services/auth/authService';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Bearer token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  // If user is not superadmin, lock them strictly to their assigned tenantId
  if (payload.role !== 'SUPERADMIN' && payload.tenantId) {
    req.tenantId = payload.tenantId;
  } else if (payload.role === 'SUPERADMIN' && req.headers['x-tenant-id']) {
    req.tenantId = req.headers['x-tenant-id'] as string;
  }

  next();
}

export function requireRole(allowedRoles: Array<'SUPERADMIN' | 'CLIENT_OWNER' | 'AGENT_OPERATOR'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Insufficient role permissions' });
      return;
    }
    next();
  };
}

