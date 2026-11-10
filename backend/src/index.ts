import { app } from './app';
import { env } from './core/config/env.config';
import { logger } from './core/config/logger.config';
import { startAutonomousCron, stopAutonomousCron } from './modules/scheduler/scheduler.cron';
import { startBullMQWorkers } from './modules/scheduler/queue.service';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 SMMA Enterprise Platform Backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  startAutonomousCron();
  startBullMQWorkers();
});

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopAutonomousCron();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
