import pino from 'pino';
import { env } from './env.config';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

