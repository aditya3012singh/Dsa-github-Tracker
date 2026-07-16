import { Worker, Job, WorkerOptions, Processor } from 'bullmq';
import { redisConnection } from '../config/redis';
import { logger } from '../observability/logger/logger';
import { metrics } from '../observability/metrics/metrics';

import { processLeetcode } from './leetcode.worker';
import { processCodeforces } from './codeforces.worker';
import { processCodeChef } from './codechef.worker';
import { processGfg } from './gfg.worker';
import { processGithub } from './github.worker';
import { startDbWriter } from './db-writer';
import { startConsumers } from '../consumers';

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

const processJob = async (job: Job) => {
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
};

function createInstrumentedWorker(queueName: string, processor: Processor, options: Omit<WorkerOptions, 'connection'> & { connection?: any }) {
    const wrappedProcessor = async (job: Job) => {
        metrics.queue.incActiveJobs(queueName);
        metrics.queue.jobStarted(queueName);
        const start = process.hrtime.bigint();
        
        try {
            const result = await processor(job);
            const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
            
            metrics.queue.jobCompleted(queueName);
            metrics.queue.recordDuration(queueName, durationSeconds);
            
            return result;
        } catch (error: any) {
            const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
            const reason = error.name || "UnknownError";
            
            metrics.queue.jobFailed(queueName, reason);
            metrics.queue.recordDuration(queueName, durationSeconds);
            
            throw error;
        } finally {
            metrics.queue.decActiveJobs(queueName);
        }
    };

    const worker = new Worker(queueName, wrappedProcessor, {
        connection: options.connection || redisConnection,
        ...options
    });
    
    worker.on('completed', (job: Job) => {
        logger.info(`Job ${job.id} on queue ${queueName} completed successfully`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
        logger.error(`Job ${job?.id} on queue ${queueName} failed`, { error: err.message });
    });
    
    return worker;
}

const worker = createInstrumentedWorker('statsFetchQueue', processJob, {
  concurrency: 3
});

const userSyncWorker = createInstrumentedWorker('userSyncFetchQueue', processJob, {
  concurrency: 5
});

logger.info('Workers initialized: statsFetchQueue (background) and userSyncFetchQueue (user-triggered).');

// Start DB writer and event consumers
const stopDbWriter = startDbWriter();
startConsumers();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down workers gracefully.');
  stopDbWriter();
  await Promise.all([
    worker.close(),
    userSyncWorker.close()
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down workers gracefully.');
  stopDbWriter();
  await Promise.all([
    worker.close(),
    userSyncWorker.close()
  ]);
  process.exit(0);
});
