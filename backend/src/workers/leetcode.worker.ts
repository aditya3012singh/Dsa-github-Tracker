import { Job } from 'bullmq';
import { leetcodeService } from '../services/leetcode.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { bufferService } from '../services/buffer/BufferService';
import { metrics, ExternalApiResult } from '../observability/metrics/metrics';

export const processLeetcode = async (job: Job) => {
  const { studentId, handle } = job.data;
  const platform = 'leetcode';
  const finishRefresh = metrics.business.startStudentRefresh(platform);
  
  try {
    const cleanHandle = sanitizeHandle(handle, platform);
    
    const apiStart = process.hrtime.bigint();
    let stats;
    try {
      stats = await leetcodeService(cleanHandle);
      const apiDuration = Number(process.hrtime.bigint() - apiStart) / 1e9;
      metrics.business.externalApiLatency(platform, apiDuration);
      metrics.business.externalApi(platform, ExternalApiResult.SUCCESS);
    } catch (apiError: any) {
      const apiDuration = Number(process.hrtime.bigint() - apiStart) / 1e9;
      metrics.business.externalApiLatency(platform, apiDuration);
      
      const isRateLimit = apiError.message?.includes('429') || apiError.message?.toLowerCase().includes('rate limit');
      metrics.business.externalApi(platform, isRateLimit ? ExternalApiResult.RATE_LIMIT : ExternalApiResult.SERVER_ERROR);
      throw apiError;
    }
    
    const packet = {
      studentId,
      platform,
      status: 'COMPLETED',
      data: {
        leetcodeSolved: stats.leetcodeSolved,
        leetcodeEasy: stats.leetcodeEasy,
        leetcodeMedium: stats.leetcodeMedium,
        leetcodeHard: stats.leetcodeHard,
      }
    };

    await bufferService.enqueue('db_write_buffer', packet);
    logger.info(`Buffered LeetCode update for student ${studentId}`);
    
    finishRefresh(true);
  } catch (error: any) {
    logger.error(`Failed to process LeetCode for student ${studentId}: ${error.message}`);
    
    const packet = {
      studentId,
      platform,
      status: 'FAILED'
    };
    await bufferService.enqueue('db_write_buffer', packet);
    
    await backoffOnRateLimit(error);
    
    finishRefresh(false);
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
