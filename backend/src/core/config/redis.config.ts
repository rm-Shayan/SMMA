import IORedis from 'ioredis';
import { env } from './env.config';
import { logger } from './logger.config';

let redisClient: IORedis | null = null;
let isRedisConnected = false;

export function getRedisClient(): IORedis {
  if (!redisClient) {
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 500, 5000);
      },
    });
    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('Auth Redis connection established');
    });
    redisClient.on('error', (err) => {
      isRedisConnected = false;
      logger.debug({ err: err.message }, 'Auth Redis connection offline (using in-memory fallback)');
    });
    redisClient.connect().catch(() => {});
  }
  return redisClient;
}

export { isRedisConnected };
