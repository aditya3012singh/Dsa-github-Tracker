import cron from 'node-cron';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

/**
 * Captures a snapshot of current ranks for all students.
 * Runs daily at midnight (00:00).
 */
export const startRankHistoryCron = () => {
  // 0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting daily rank history snapshot...');
    try {
      // 1. Fetch all students sorted by overallScore
      const students = await prisma.codingStats.findMany({
        orderBy: { overallScore: 'desc' },
        select: {
          studentId: true,
          overallScore: true
        }
      });

      // 2. Prepare snapshots
      const snapshots = students.map((stat, index) => ({
        studentId: stat.studentId,
        rank: index + 1,
        score: stat.overallScore
      }));

      // 3. Store in DB (Bulk insert)
      // Note: For 10,000 students, we might want to batch this to avoid large transaction
      const batchSize = 1000;
      for (let i = 0; i < snapshots.length; i += batchSize) {
        const batch = snapshots.slice(i, i + batchSize);
        await prisma.rankHistory.createMany({
          data: batch
        });
      }

      logger.info(`Daily rank snapshot completed. Captured ${snapshots.length} students.`);
    } catch (error: any) {
      logger.error('Rank history snapshot failed:', error);
    }
  });
};
