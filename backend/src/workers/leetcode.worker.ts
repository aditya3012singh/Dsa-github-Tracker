import { Job } from 'bullmq';
import { prisma } from '../config/db';
import { leetcodeService } from '../services/leetcode.service';
import { logger } from '../utils/logger';
import { calculateOverallScore } from '../utils/scoring';
import { sanitizeHandle } from '../utils/sanitizer';

export const processLeetcode = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'leetcode');
    const stats = await leetcodeService(cleanHandle);
    
    const existingStats = await prisma.codingStats.findUnique({
      where: { studentId },
    });

    const newData = {
      leetcodeSolved: stats.leetcodeSolved,
      leetcodeEasy: stats.leetcodeEasy,
      leetcodeMedium: stats.leetcodeMedium,
      leetcodeHard: stats.leetcodeHard,
    };

    const totalSolved = (stats.leetcodeSolved || 0) + (existingStats?.gfgSolved || 0) + (existingStats?.codechefSolved || 0);
    const mergedStats = { ...existingStats, ...newData, totalSolved };
    const overallScore = calculateOverallScore(mergedStats);

    await prisma.$transaction([
      prisma.codingStats.upsert({
        where: { studentId },
        update: { ...newData, totalSolved, overallScore } as any,
        create: { studentId, ...newData, totalSolved, overallScore } as any,
      }),
      prisma.fetchJob.upsert({
        where: {
          studentId_platform: { studentId, platform: 'leetcode' }
        },
        update: { status: 'COMPLETED', lastRun: new Date() },
        create: { studentId, platform: 'leetcode', status: 'COMPLETED' }
      })
    ]);

    // Sync with Redis for fast rank retrieval and cache invalidation
    const { updateRedisStats } = await import('../utils/redis-helper');
    await updateRedisStats(studentId, overallScore);

    logger.info(`Successfully processed LeetCode for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed to process LeetCode for student ${studentId}: ${error.message}`);
    
    await prisma.fetchJob.upsert({
      where: {
        studentId_platform: { studentId, platform: 'leetcode' }
      },
      update: { status: 'FAILED', lastRun: new Date() },
      create: { studentId, platform: 'leetcode', status: 'FAILED' }
    });
    
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
