import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';
import { env } from '../config/env.config';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err }, 'Unhandled application error');
  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}
