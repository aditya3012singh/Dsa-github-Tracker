import cron from 'node-cron';
import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
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

const initializeFetchSchedule = async () => {
  try {
    const total = await redisConnection.zcard('fetch_schedule');
    if (total === 0) {
      logger.info('[Redis Schedule] fetch_schedule ZSET is empty. Initializing from database...');
      const students = await prisma.student.findMany({
        select: {
          id: true,
          codingStats: { select: { updatedAt: true } }
        }
      });
      
      const now = Date.now();
      const pipeline = redisConnection.pipeline();
      for (const student of students) {
        const lastUpdated = student.codingStats?.updatedAt ? new Date(student.codingStats.updatedAt).getTime() : 0;
        // Schedule is lastUpdated + 11 hours. If never updated, schedule for now.
        const nextSchedule = lastUpdated > 0 ? lastUpdated + 11 * 60 * 60 * 1000 : now;
        pipeline.zadd('fetch_schedule', nextSchedule, student.id);
      }
      await pipeline.exec();
      logger.info(`[Redis Schedule] Successfully initialized ${students.length} students in fetch_schedule.`);
    }
  } catch (err) {
    logger.error('[Redis Schedule] Initialization failed:', err);
  }
};

export const startCronJobs = () => {
  // Initialize schedule at boot
  initializeFetchSchedule();

  // Run every 15 minutes to spread the load
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Starting cron job to enqueue fetch jobs (Smooth Batching via Redis)');
    
    try {
      await initializeFetchSchedule(); // Backup check to ensure ZSET exists

      const now = Date.now();
      // Get up to 250 student IDs whose schedule is <= now
      const studentIds = await redisConnection.zrangebyscore('fetch_schedule', '-inf', now, 'LIMIT', 0, 250);

      if (studentIds.length === 0) {
        logger.info('No students are currently due for updates.');
        return;
      }

      // Fetch the handles for only these 250 students (highly efficient index lookup)
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds } }
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

      // Update schedule for these enqueued students in Redis (schedule next run in 11 hours)
      const nextSchedule = Date.now() + 11 * 60 * 60 * 1000;
      const pipeline = redisConnection.pipeline();
      for (const id of studentIds) {
        pipeline.zadd('fetch_schedule', nextSchedule, id);
      }
      await pipeline.exec();

      logger.info(`Successfully enqueued ${enqueuedCount} fetch jobs and updated Redis schedule`);
    } catch (error) {
      logger.error('Error running cron job:', error);
    }
  });
  
  logger.info('Cron jobs scheduled');
};
