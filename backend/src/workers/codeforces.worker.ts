import { Job } from 'bullmq';
import { prisma } from '../config/db';
import { codeforcesService } from '../services/codeforces.service';
import { logger } from '../utils/logger';
import { calculateOverallScore } from '../utils/scoring';
import { sanitizeHandle } from '../utils/sanitizer';

export const processCodeforces = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'codeforces');
    const stats = await codeforcesService(cleanHandle);
    
    const existingStats = await prisma.codingStats.findUnique({
      where: { studentId },
    });

    const newData = {
      codeforcesRating: stats.codeforcesRating,
      codeforcesMaxRating: stats.codeforcesMaxRating,
    };

    const mergedStats = { ...existingStats, ...newData };
    const overallScore = calculateOverallScore(mergedStats);

    await prisma.$transaction([
      prisma.codingStats.upsert({
        where: { studentId },
        update: { ...newData, overallScore } as any,
        create: { studentId, ...newData, overallScore } as any,
      }),
      prisma.fetchJob.upsert({
        where: { studentId_platform: { studentId, platform: 'codeforces' } },
        update: { status: 'COMPLETED', lastRun: new Date() },
        create: { studentId, platform: 'codeforces', status: 'COMPLETED' }
      })
    ]);

    logger.info(`Successfully processed Codeforces for student ${studentId}`);
    const { updateRedisStats } = await import('../utils/redis-helper');
    await updateRedisStats(studentId, overallScore);

  } catch (error: any) {
    logger.error(`Failed to process Codeforces for student ${studentId}: ${error.message}`);
    await prisma.fetchJob.upsert({
      where: { studentId_platform: { studentId, platform: 'codeforces' } },
      update: { status: 'FAILED', lastRun: new Date() },
      create: { studentId, platform: 'codeforces', status: 'FAILED' }
    });
    throw error;
  }
};
