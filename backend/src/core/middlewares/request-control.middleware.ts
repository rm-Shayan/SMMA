import { Request, Response, NextFunction } from 'express';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function globalApiRateLimit(opts?: { windowMs?: number; max?: number }) {
  const windowMs = opts?.windowMs ?? 60_000;
  const max = opts?.max ?? 120;
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const actor = (req as any).user?.userId || 'anon';
    const tenant = (req as any).tenantId || (req as any).user?.tenantId || 'global';
    const key = `${tenant}:${actor}:${req.method}:${req.baseUrl || ''}`;
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    b.count += 1;
    if (b.count > max) {
      res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded, try again shortly' });
      return;
    }
    next();
  };
}

export function requireIdempotencyKeyForWrites(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) { next(); return; }
  if (req.path.startsWith('/webhooks') || req.path === '/health') { next(); return; }
  const key = req.header('idempotency-key') || req.header('x-idempotency-key') || (req.body && (req.body.idempotencyKey || req.body.idempotency_key));
  if (key) (req as any).idempotencyKey = String(key).slice(0, 120);
  // non-blocking for compatibility: attach if provided; downstream policy enforces for tool side-effects
  next();
}
