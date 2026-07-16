import { Job } from 'bullmq';
import { githubService } from '../services/github.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { bufferService } from '../services/buffer/BufferService';
import { metrics, ExternalApiResult } from '../observability/metrics/metrics';

export const processGithub = async (job: Job) => {
  const { studentId, handle } = job.data;
  const platform = 'github';
  const finishRefresh = metrics.business.startStudentRefresh(platform);
  
  try {
    const cleanHandle = sanitizeHandle(handle, platform);
    
    const apiStart = process.hrtime.bigint();
    let stats;
    try {
      stats = await githubService(cleanHandle);
      const apiDuration = Number(process.hrtime.bigint() - apiStart) / 1e9;
      metrics.business.externalApiLatency(platform, apiDuration);
      metrics.business.externalApi(platform, ExternalApiResult.SUCCESS);
    } catch (apiError: any) {
      const apiDuration = Number(process.hrtime.bigint() - apiStart) / 1e9;
      metrics.business.externalApiLatency(platform, apiDuration);
      
      const isRateLimit = apiError.message?.includes('429') || apiError.message?.toLowerCase().includes('rate limit') || apiError.message?.toLowerCase().includes('secondary rate limit');
      metrics.business.externalApi(platform, isRateLimit ? ExternalApiResult.RATE_LIMIT : ExternalApiResult.SERVER_ERROR);
      throw apiError;
    }
    
    const packet = {
      studentId,
      platform,
      status: 'COMPLETED',
      data: {
        githubContributions: stats.githubContributions,
        githubRepos: stats.githubRepos,
        githubFollowers: stats.githubFollowers,
        githubFollowing: stats.githubFollowing,
      }
    };

    await bufferService.enqueue('db_write_buffer', packet);
    logger.info(`Buffered GitHub update for student ${studentId}`);
    
    finishRefresh(true);
  } catch (error: any) {
    logger.error(`Failed to process GitHub for student ${studentId}: ${error.message}`);
    
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
