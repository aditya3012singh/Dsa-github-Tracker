import cron from 'node-cron';
import { prisma } from '../config/db';
import { statsQueue } from '../queues/stats.queue';
import { logger } from '../utils/logger';

// Job names mapping for different platforms
const jobNames = [
  { name: 'leetcode', handleField: 'leetcodeHandle' },
  { name: 'codeforces', handleField: 'codeforcesHandle' },
  { name: 'codechef', handleField: 'codechefHandle' },
  { name: 'gfg', handleField: 'gfgHandle' },
  { name: 'github', handleField: 'githubHandle' }
] as const;

export const startCronJobs = () => {
  // Run at 7:30 AM for testing
  cron.schedule('30 7 * * *', async () => {
    logger.info('Starting cron job to enqueue fetch jobs (Testing 7:30 AM)');
    
    try {
      // Temporarily bypassing the 11-hour check to force testing over newly seeded data
      // const elevenHoursAgo = new Date(Date.now() - 11 * 60 * 60 * 1000);
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { codingStats: { is: null } },
            { codingStats: { updatedAt: { lte: oneMinuteAgo } } }
          ]
        },
        take: 250, // Process 250 students every 15 minutes
      });

      logger.info(`Found ${students.length} students to process`);

      let enqueuedCount = 0;

      for (const student of students) {
        for (const platform of jobNames) {
          const handle = student[platform.handleField as keyof typeof student];
          
          if (handle) {
            await statsQueue.add(platform.name as any, {
              studentId: student.id as any,
              platform: platform.name as any,
              handle: handle as string,
            } as any, {
              jobId: `${student.id}-${platform.name}-${new Date().getTime()}`
            } as any);
            enqueuedCount++;
          }
        }
      }

      logger.info(`Successfully enqueued ${enqueuedCount} fetch jobs`);
    } catch (error) {
      logger.error('Error running cron job:', error);
    }
  });
  
  logger.info('Cron jobs scheduled');
};
