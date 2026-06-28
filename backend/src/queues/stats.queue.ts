import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

// Define the shape of the job data
export interface StatsJobData {
  studentId: string;
  platform: 'leetcode' | 'codeforces' | 'codechef' | 'gfg' ;
  handle: string;
}

// Global queue for fetching stats
export const statsQueue = new Queue<StatsJobData>('statsFetchQueue', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: {
      count: 100, // Keep last 100 failures for debugging
      age: 24 * 3600 // or keep for 24 hours
    },
  },
});

// Dedicated queue for manual/user-triggered syncs
export const userSyncQueue = new Queue<StatsJobData>('userSyncFetchQueue', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: {
      count: 100, // Keep last 100 failures for debugging
      age: 24 * 3600 // or keep for 24 hours
    },
  },
});
