import { Job } from 'bullmq';
import { codeforcesService } from '../services/codeforces.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { bufferService } from '../services/buffer/BufferService';
import { metrics, ExternalApiResult } from '../observability/metrics/metrics';

export const processCodeforces = async (job: Job) => {
  const { studentId, handle } = job.data;
  const platform = 'codeforces';
  const finishRefresh = metrics.business.startStudentRefresh(platform);
  
  try {
    const cleanHandle = sanitizeHandle(handle, platform);
    
    const apiStart = process.hrtime.bigint();
    let stats;
    try {
      stats = await codeforcesService(cleanHandle);
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
        codeforcesRating: stats.codeforcesRating,
        codeforcesMaxRating: stats.codeforcesMaxRating,
      }
    };

    await bufferService.enqueue('db_write_buffer', packet);
    logger.info(`Buffered Codeforces update for student ${studentId}`);
    
    finishRefresh(true);
  } catch (error: any) {
    logger.error(`Failed to process Codeforces for student ${studentId}: ${error.message}`);
    
    const packet = {
      studentId,
      platform,
      status: 'FAILED'
    };
    await bufferService.enqueue('db_write_buffer', packet);
    
    finishRefresh(false);
    throw error;
  }
};
