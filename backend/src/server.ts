import 'dotenv/config';
import { app } from './app';
import { logger } from './utils/logger';
import { startCronJobs } from './cron/stats.cron';
import { startRankHistoryCron } from './cron/rank-history.cron';

const PORT = process.env.PORT || 3000;

const startServer = () => {
  try {
    app.listen(PORT, async () => {
      logger.info(`Server is running on port ${PORT}`);
      // Clear legacy cache keys
      const { redisConnection } = await import('./config/redis');
      await redisConnection.del('leaderboard');
      startCronJobs();
      startRankHistoryCron();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Global error handlers to prevent process crashes in production
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Optional: Graceful shutdown if error is critical
  // process.exit(1);
});

startServer();
