import { Job } from 'bullmq';
import { leetcodeService } from '../services/leetcode.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { redisConnection } from '../config/redis';

export const processLeetcode = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'leetcode');
    const stats = await leetcodeService(cleanHandle);
    
    const packet = {
      studentId,
      platform: 'leetcode',
      status: 'COMPLETED',
      data: {
        leetcodeSolved: stats.leetcodeSolved,
        leetcodeEasy: stats.leetcodeEasy,
        leetcodeMedium: stats.leetcodeMedium,
        leetcodeHard: stats.leetcodeHard,
      }
    };

    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    logger.info(`Buffered LeetCode update for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed to process LeetCode for student ${studentId}: ${error.message}`);
    
    const packet = {
      studentId,
      platform: 'leetcode',
      status: 'FAILED'
    };
    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    
    await backoffOnRateLimit(error);
    throw error;
  }
};

const backoffOnRateLimit = async (error: any) => {
  const isRateLimit = error.message.includes('429') || 
                      error.message.toLowerCase().includes('rate limit') || 
                      error.message.toLowerCase().includes('throttled');
                      
  if (isRateLimit) {
    // Randomized backoff 5-15 seconds
    const delay = Math.floor(Math.random() * 10000) + 5000;
    logger.warn(`Rate limit hit. Backing off for ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};
