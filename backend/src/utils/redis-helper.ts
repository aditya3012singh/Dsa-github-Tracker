import { redisConnection } from '../config/redis';
import { logger } from './logger';

/**
 * Update student rank in Redis ZSET and invalidate leaderboard cache (via versioning)
 */
export const updateRedisStats = async (studentId: string, overallScore: number) => {
  try {
    const pipeline = redisConnection.pipeline();
    
    // Update rank in ZSET
    pipeline.zadd('leaderboard_ranks', overallScore, studentId);
    
    await pipeline.exec();
  } catch (error) {
    logger.error(`Failed to update Redis stats for student ${studentId}:`, error);
  }
};
