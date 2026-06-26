import { Job } from 'bullmq';
import { codeforcesService } from '../services/codeforces.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { redisConnection } from '../config/redis';

export const processCodeforces = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'codeforces');
    const stats = await codeforcesService(cleanHandle);
    
    const packet = {
      studentId,
      platform: 'codeforces',
      status: 'COMPLETED',
      data: {
        codeforcesRating: stats.codeforcesRating,
        codeforcesMaxRating: stats.codeforcesMaxRating,
      }
    };

    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    logger.info(`Buffered Codeforces update for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed to process Codeforces for student ${studentId}: ${error.message}`);
    
    const packet = {
      studentId,
      platform: 'codeforces',
      status: 'FAILED'
    };
    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    throw error;
  }
};
