import { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisConnected } from '../../core/config/redis.config';
import { logger } from '../../core/config/logger.config';

const fallbackStores = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of fallbackStores.entries()) {
    if (now >= bucket.resetAt) fallbackStores.delete(key);
  }
}, 60000).unref();

type KeyGenerator = (req: Request) => string;

export function createAuthRateLimiter(options: {
  maxRequests: number;
  windowMs: number;
  message?: string;
  keyGenerator?: KeyGenerator;
}) {
  const maxRequests = options.maxRequests;
  const windowMs = options.windowMs;
  const message = options.message || 'Too many requests. Please try again later.';
  const keyGenerator = options.keyGenerator || ((req) => (req.ip || 'anonymous') + ':' + req.baseUrl);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = 'auth:rl:' + keyGenerator(req);

    if (isRedisConnected) {
      try {
        const redis = getRedisClient();
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        if (count > maxRequests) {
          const ttl = await redis.ttl(key);
          res.setHeader('Retry-After', ttl > 0 ? ttl : Math.ceil(windowMs / 1000));
          res.status(429).json({ error: 'Too Many Requests', message, retryAfterSeconds: ttl > 0 ? ttl : Math.ceil(windowMs / 1000) });
          return;
        }
        next();
        return;
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Auth rate limiter Redis failed, falling back to in-memory store');
      }
    }

    const now = Date.now();
    let bucket = fallbackStores.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      fallbackStores.set(key, bucket);
    } else {
      bucket.count += 1;
    }
    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ error: 'Too Many Requests', message, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) });
      return;
    }
    next();
  };
}

const isDev = process.env.NODE_ENV !== 'production';

export const loginRateLimiter = createAuthRateLimiter({
  maxRequests: isDev ? 100 : 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = (req.body && (req.body as any).email) || 'unknown';
    return `login:${(req.ip || 'anonymous')}:${String(email).toLowerCase()}`;
  },
});

export const registerRateLimiter = createAuthRateLimiter({
  maxRequests: isDev ? 100 : 3,
  windowMs: 15 * 60 * 1000,
  message: 'Too many registration attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => `register:${(req.ip || 'anonymous')}`,
});

export const forgotPasswordRateLimiter = createAuthRateLimiter({
  maxRequests: isDev ? 100 : 3,
  windowMs: 15 * 60 * 1000,
  message: 'Too many password reset requests. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = (req.body && (req.body as any).email) || 'unknown';
    return `forgot:${(req.ip || 'anonymous')}:${String(email).toLowerCase()}`;
  },
});
