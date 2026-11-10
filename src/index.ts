import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { startAutonomousCron, stopAutonomousCron } from './services/scheduler/cronEngine';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 SMMA Platform Backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  // Start the 24/7 Autonomous Peak-Hour Scheduling Clock
  startAutonomousCron();
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

