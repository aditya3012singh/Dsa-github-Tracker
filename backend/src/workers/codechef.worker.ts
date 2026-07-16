import { Job } from 'bullmq';
import { codechefService } from '../services/codechef.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { bufferService } from '../services/buffer/BufferService';
import { metrics, ExternalApiResult } from '../observability/metrics/metrics';

export const processCodeChef = async (job: Job) => {
  const { studentId, handle } = job.data;
  const platform = 'codechef';
  const finishRefresh = metrics.business.startStudentRefresh(platform);
  
  try {
    const cleanHandle = sanitizeHandle(handle, platform);
    
    const apiStart = process.hrtime.bigint();
    let stats;
    try {
      stats = await codechefService(cleanHandle);
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
        codechefRating: stats.codechefRating,
        codechefSolved: stats.codechefSolved,
      }
    };

    await bufferService.enqueue('db_write_buffer', packet);
    logger.info(`Buffered CodeChef update for student ${studentId}`);
    
    finishRefresh(true);
  } catch (error: any) {
    logger.error(`Failed process CodeChef for student ${studentId}: ${error.message}`);
    
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
