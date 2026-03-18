import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

// Define the shape of the job data
export interface StatsJobData {
  studentId: string;
  platform: 'leetcode' | 'codeforces' | 'codechef' | 'gfg' | 'hackerrank' | 'hackerearth' | 'atcoder';
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
    removeOnFail: false,
  },
});
