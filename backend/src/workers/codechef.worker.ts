import { Job } from 'bullmq';
import { codechefService } from '../services/codechef.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { redisConnection } from '../config/redis';

export const processCodeChef = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'codechef');
    const stats = await codechefService(cleanHandle);
    
    const packet = {
      studentId,
      platform: 'codechef',
      status: 'COMPLETED',
      data: {
        codechefRating: stats.codechefRating,
        codechefSolved: stats.codechefSolved,
      }
    };

    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    logger.info(`Buffered CodeChef update for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed process CodeChef for student ${studentId}: ${error.message}`);
    
    const packet = {
      studentId,
      platform: 'codechef',
      status: 'FAILED'
    };
    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    throw error;
  }
};
