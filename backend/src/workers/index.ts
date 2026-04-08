import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';

import { processLeetcode } from './leetcode.worker';
import { processCodeforces } from './codeforces.worker';
import { processCodeChef } from './codechef.worker';
import { processGfg } from './gfg.worker';
import { processGithub } from './github.worker';

// Helper for sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple in-memory rate limiting to throttle requests according to instructions.
// Example limits: LeetCode -> 10 req/sec, Codeforces -> 5 req/sec
const platformDelays: Record<string, number> = {
  leetcode: 100, // 10 per sec
  codeforces: 200, // 5 per sec
  codechef: 333, // 3 per sec
  gfg: 500, // 2 per sec
  github: 200,
};

const worker = new Worker('statsFetchQueue', async (job: Job) => {
  const { platform } = job.data;
  
  // Enforce artificial delay for basic rate limiting in worker
  if (platformDelays[platform]) {
    await sleep(platformDelays[platform]);
  }

  job.log(`Starting processing for ${platform}`);

  switch (platform) {
    case 'leetcode':
      await processLeetcode(job);
      break;
    case 'codeforces':
      await processCodeforces(job);
      break;
    case 'codechef':
      await processCodeChef(job);
      break;
    case 'gfg':
      await processGfg(job);
      break;
    case 'github':
      await processGithub(job);
      break;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}, {
  connection: redisConnection as any,
  concurrency: 3 // Reduced for free tier (512MB RAM) stability
});

worker.on('completed', async (job: Job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`Job ${job?.id} failed with error ${err.message}`);
});

logger.info('Worker initialized and listening to statsFetchQueue.');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down worker gracefully.');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down worker gracefully.');
  await worker.close();
  process.exit(0);
});
