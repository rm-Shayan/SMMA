import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
    if (!record.timestamps.length) rateLimitStore.delete(key);
  }
}, 30000).unref();

export function createRateLimiter(options: { maxRequests: number; windowMs?: number; message?: string }) {
  const maxRequests = options.maxRequests;
  const windowMs = options.windowMs || 60000;
  const message = options.message || 'Too many requests. Please slow down and try again.';

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = (req.user?.userId || req.tenantId || req.ip || 'anonymous') + ':' + req.baseUrl;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(key, record);
    }

    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0] || now;
      const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds,
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

export const agentChatRateLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60000,
  message: 'AI chat request quota exceeded (60 req/min). Please try again shortly.',
});

export const trainingAskRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60000,
  message: 'Intern training Q&A quota exceeded (30 req/min). Please try again shortly.',
});

