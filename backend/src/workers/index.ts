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

function classifyError(error: any): string {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("timeout")) return "timeout";
    if (msg.includes("redis") || msg.includes("ioredis")) return "redis_error";
    if (msg.includes("fetch") || msg.includes("api") || msg.includes("axios")) return "api_error";
    if (msg.includes("prisma") || msg.includes("db") || msg.includes("database")) return "db_error";
    return error?.name || "unknown_error";
}

function createInstrumentedWorker(queueName: string, processor: Processor, options: Omit<WorkerOptions, 'connection'> & { connection?: any }) {
    const executeJob = async (job: Job) => {
        metrics.queue.incActiveJobs(queueName);
        metrics.queue.jobStarted(queueName);
        
        if (job.timestamp) {
            const waitTimeSeconds = (Date.now() - job.timestamp) / 1000;
            metrics.queue.recordWaitTime(queueName, waitTimeSeconds);
        }
        
        const start = process.hrtime.bigint();
        
        try {
            const result = await processor(job);
            metrics.queue.jobCompleted(queueName);
            return result;
        } catch (error: any) {
            const reason = classifyError(error);
            metrics.queue.jobFailed(queueName, reason);
            
            if (job.attemptsMade > 0) {
                metrics.queue.jobRetried(queueName);
            }
            
            throw error;
        } finally {
            const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
            metrics.queue.recordDuration(queueName, durationSeconds);
            metrics.queue.decActiveJobs(queueName);
        }
    };

    const worker = new Worker(queueName, executeJob, {
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
