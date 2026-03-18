import 'dotenv/config';
import { app } from './app';
import { logger } from './utils/logger';
import { startCronJobs } from './cron/stats.cron';

const PORT = process.env.PORT || 3000;

const startServer = () => {
  try {
    app.listen(PORT, async () => {
      logger.info(`Server is running on port ${PORT}`);
      // Clear cache on restart to reflect structure changes
      const { redisConnection } = await import('./config/redis');
      await redisConnection.del('leaderboard');
      startCronJobs();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
