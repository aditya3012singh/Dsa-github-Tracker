import { Job } from 'bullmq';
import { prisma } from '../config/db';
import { githubService } from '../services/github.service';
import { logger } from '../utils/logger';
import { calculateOverallScore } from '../utils/scoring';
import { sanitizeHandle } from '../utils/sanitizer';

export const processGithub = async (job: Job) => {
  const { studentId, handle } = job.data;
  
  try {
    const cleanHandle = sanitizeHandle(handle, 'github');
    const stats = await githubService(cleanHandle);
    
    // Get existing stats to calculate overall score accurately
    const existingStats = await prisma.codingStats.findUnique({
      where: { studentId },
    });

    const newData = {
      githubContributions: stats.githubContributions,
      githubRepos: stats.githubRepos,
      githubFollowers: stats.githubFollowers,
      githubFollowing: stats.githubFollowing,
    };

    const mergedStats = { ...existingStats, ...newData };
    const overallScore = calculateOverallScore(mergedStats);

    await prisma.$transaction([
      prisma.codingStats.upsert({
        where: { studentId },
        update: {
          ...newData,
          overallScore
        } as any,
        create: {
          studentId,
          ...newData,
          overallScore
        } as any,
      }),
      prisma.fetchJob.upsert({
        where: {
          studentId_platform: { studentId, platform: 'github' }
        },
        update: { status: 'COMPLETED', lastRun: new Date() },
        create: { studentId, platform: 'github', status: 'COMPLETED' }
      })
    ]);

    logger.info(`Successfully processed GitHub for student ${studentId}`);
  } catch (error: any) {
    logger.error(`Failed to process GitHub for student ${studentId}: ${error.message}`);
    
    await prisma.fetchJob.upsert({
      where: {
        studentId_platform: { studentId, platform: 'github' }
      },
      update: { status: 'FAILED', lastRun: new Date() },
      create: { studentId, platform: 'github', status: 'FAILED' }
    });
    
    throw error;
  }
};
