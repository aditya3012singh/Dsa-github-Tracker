import cron from 'node-cron';
import { prisma } from '../config/db';
import { statsQueue } from '../queues/stats.queue';
import { logger } from '../utils/logger';

// Job names mapping for different platforms
const jobNames = [
  { name: 'leetcode', handleField: 'leetcodeHandle' },
  { name: 'codeforces', handleField: 'codeforcesHandle' },
  // { name: 'codechef', handleField: 'codechefHandle' },
  { name: 'gfg', handleField: 'gfgHandle' },
  { name: 'github', handleField: 'githubHandle' }
] as const;

export const startCronJobs = () => {
  // Schedule to run 3 times a day at 6 AM, 1 PM, and 9 PM (IST)
  cron.schedule(
    '0 6,15,21 * * *',
    async () => {
      logger.info('Starting scheduled 3x daily cron job to enqueue all stats updates (6 AM / 1 PM / 9 PM IST)...');
      
      try {
        const students = await prisma.student.findMany();
        logger.info(`Found ${students.length} students to enqueue.`);

        let enqueuedCount = 0;

        for (const student of students) {
          for (const platform of jobNames) {
            const handle = student[platform.handleField as keyof typeof student];
            
            if (handle) {
              await statsQueue.add(
                platform.name as any,
                {
                  studentId: student.id,
                  platform: platform.name as any,
                  handle: handle as string,
                },
                {
                  // Ensure uniqueness using student, platform, and a 3x daily window identifier
                  jobId: `${student.id}-${platform.name}-${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-')}-${new Date().getHours()}`
                }
              );
              enqueuedCount++;
            }
          }
        }

        logger.info(`Successfully enqueued ${enqueuedCount} fetch jobs for the 3x daily update.`);
      } catch (error) {
        logger.error('Error running 3x daily scheduled cron job:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    }
  );
  
  logger.info('3x daily cron jobs (5 AM, 1 PM, 9 PM IST) scheduled successfully');
};
