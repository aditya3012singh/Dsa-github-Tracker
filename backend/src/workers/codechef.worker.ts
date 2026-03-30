import { Job } from 'bullmq';
import { prisma } from '../config/db';
import { codechefService } from '../services/codechef.service';
import { logger } from '../utils/logger';
import { calculateOverallScore } from '../utils/scoring';
import { sanitizeHandle } from '../utils/sanitizer';

export const processCodeChef = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'codechef');
    const stats = await codechefService(cleanHandle);
    
    const existingStats = await prisma.codingStats.findUnique({
      where: { studentId },
    });

    const newData = {
      codechefRating: stats.codechefRating,
      codechefSolved: stats.codechefSolved,
    };

    const totalSolved = (stats.codechefSolved || 0) + (existingStats?.leetcodeSolved || 0) + (existingStats?.gfgSolved || 0);
    const mergedStats = { ...(existingStats || {}), ...newData, totalSolved };
    const overallScore = calculateOverallScore(mergedStats);

    await prisma.$transaction([
      prisma.codingStats.upsert({
        where: { studentId },
        update: { ...newData, totalSolved, overallScore } as any,
        create: { studentId, ...newData, totalSolved, overallScore } as any,
      }),
      prisma.fetchJob.upsert({
        where: { studentId_platform: { studentId, platform: 'codechef' } },
        update: { status: 'COMPLETED', lastRun: new Date() },
        create: { studentId, platform: 'codechef', status: 'COMPLETED' }
      })
    ]);

    logger.info(`Successfully processed CodeChef for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed process CodeChef for student ${studentId}: ${error.message}`);
    await prisma.fetchJob.upsert({
      where: { studentId_platform: { studentId, platform: 'codechef' } },
      update: { status: 'FAILED', lastRun: new Date() },
      create: { studentId, platform: 'codechef', status: 'FAILED' }
    });
    throw error;
  }
};
