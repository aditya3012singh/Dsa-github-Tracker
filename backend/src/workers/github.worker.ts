import { Job } from 'bullmq';
import { githubService } from '../services/github.service';
import { logger } from '../utils/logger';
import { sanitizeHandle } from '../utils/sanitizer';
import { redisConnection } from '../config/redis';

export const processGithub = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'github');
    const stats = await githubService(cleanHandle);
    
    const packet = {
      studentId,
      platform: 'github',
      status: 'COMPLETED',
      data: {
        githubContributions: stats.githubContributions,
        githubRepos: stats.githubRepos,
        githubFollowers: stats.githubFollowers,
        githubFollowing: stats.githubFollowing,
      }
    };

    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    logger.info(`Buffered GitHub update for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed to process GitHub for student ${studentId}: ${error.message}`);
    
    const packet = {
      studentId,
      platform: 'github',
      status: 'FAILED'
    };
    await redisConnection.lpush('db_write_buffer', JSON.stringify(packet));
    throw error;
  }
};
