import { Job } from 'bullmq';
import { prisma } from '../config/db';
import { gfgService } from '../services/gfg.service';
import { logger } from '../utils/logger';
import { calculateOverallScore } from '../utils/scoring';
import { sanitizeHandle } from '../utils/sanitizer';

export const processGfg = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'gfg');
    const stats = await gfgService(cleanHandle);
    
    const existingStats = await prisma.codingStats.findUnique({
      where: { studentId },
    });
 
    const newData = {
      gfgSolved: stats.gfgSolved,
    };
 
    const mergedStats = { ...(existingStats || {}), ...newData };
    const overallScore = calculateOverallScore(mergedStats);
 
    await prisma.$transaction([
      prisma.codingStats.upsert({
        where: { studentId },
        update: { ...newData, overallScore } as any,
        create: { studentId, ...newData, overallScore } as any,
      }),
      prisma.fetchJob.upsert({
        where: { studentId_platform: { studentId, platform: 'gfg' } },
        update: { status: 'COMPLETED', lastRun: new Date() },
        create: { studentId, platform: 'gfg', status: 'COMPLETED' }
      })
    ]);

    logger.info(`Successfully processed GfG for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed to process GfG for student ${studentId}: ${error.message}`);
    await prisma.fetchJob.upsert({
      where: { studentId_platform: { studentId, platform: 'gfg' } },
      update: { status: 'FAILED', lastRun: new Date() },
      create: { studentId, platform: 'gfg', status: 'FAILED' }
    });
    throw error;
  }
};
