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

    const mergedStats = { ...existingStats, ...newData };
    const overallScore = calculateOverallScore(mergedStats);

    await prisma.$transaction([
      prisma.codingStats.upsert({
        where: { studentId },
        update: { ...newData, overallScore } as any,
        create: { studentId, ...newData, overallScore } as any,
      }),
      prisma.fetchJob.upsert({
        where: {
          studentId_platform: { studentId, platform: 'leetcode' }
        },
        update: { status: 'COMPLETED', lastRun: new Date() },
        create: { studentId, platform: 'leetcode', status: 'COMPLETED' }
      })
    ]);

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
    
    throw error;
  }
};
