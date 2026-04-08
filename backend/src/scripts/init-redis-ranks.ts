import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';

async function initRedisRanks() {
  try {
    logger.info('Initializing Redis ZSET for leaderboard ranks...');
    
    const stats = await prisma.codingStats.findMany({
      select: {
        studentId: true,
        overallScore: true,
      },
    });

    if (stats.length === 0) {
      logger.info('No coding stats found in database.');
      return;
    }

    const pipeline = redisConnection.pipeline();
    // Clear existing ranks if any (optional, but safer for full init)
    pipeline.del('leaderboard_ranks');

    stats.forEach((stat) => {
      pipeline.zadd('leaderboard_ranks', stat.overallScore, stat.studentId);
    });

    await pipeline.exec();
    logger.info(`Successfully initialized ${stats.length} student ranks in Redis.`);
  } catch (error) {
    logger.error('Error initializing Redis ranks:', error);
  } finally {
    process.exit(0);
  }
}

initRedisRanks();
