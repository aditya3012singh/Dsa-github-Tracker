import { Job } from 'bullmq';
import { gfgService } from '../services/gfg.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { redisConnection } from '../config/redis';

export const processGfg = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'gfg');
    const stats = await gfgService(cleanHandle);
    
    const packet = {
      studentId,
      platform: 'gfg',
      status: 'COMPLETED',
      data: {
        gfgSolved: stats.gfgSolved,
      }
    };

    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    logger.info(`Buffered GfG update for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed to process GfG for student ${studentId}: ${error.message}`);
    
    const packet = {
      studentId,
      platform: 'gfg',
      status: 'FAILED'
    };
    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    throw error;
  }
};
