import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';
import { publishEvent } from '../utils/event-bus';
import { updateRedisStats } from '../utils/redis-helper';

const BATCH_SIZE = 100;
let isProcessing = false;

/**
 * Polls the Redis write buffer and writes student stats updates in batches.
 */
export const processBufferBatch = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const packets: any[] = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const item = await redisConnection.rpop('db_write_buffer');
      if (!item) break;
      try {
        packets.push(JSON.parse(item));
      } catch (err: any) {
        logger.error('Failed to parse buffered packet:', err);
      }
    }

    if (packets.length === 0) {
      isProcessing = false;
      return;
    }

    logger.info(`Processing database write buffer batch of ${packets.length} items`);

    // 1. Group unique student IDs we need to query
    const studentIds = Array.from(new Set(packets.map(p => p.studentId)));

    // 2. Fetch existing stats for these students in a single query
    const existingStatsList = await prisma.codingStats.findMany({
      where: { studentId: { in: studentIds } }
    });

    const statsMap: Record<string, any> = {};
    for (const stats of existingStatsList) {
      statsMap[stats.studentId] = stats;
    }

    // Initialize maps/lists for batching
    const updatedStatsMap: Record<string, any> = {};
    const fetchJobUpdates: Array<{ studentId: string; platform: string; status: string }> = [];
    const eventsToPublish: any[] = [];

    // Helper to retrieve the current in-progress stats for a student
    const getStats = (studentId: string) => {
      if (updatedStatsMap[studentId]) return updatedStatsMap[studentId];
      if (statsMap[studentId]) return { ...statsMap[studentId] };
      return {
        studentId,
        leetcodeSolved: 0,
        leetcodeEasy: 0,
        leetcodeMedium: 0,
        leetcodeHard: 0,
        codeforcesRating: 0,
        codeforcesMaxRating: 0,
        codechefRating: 0,
        gfgSolved: 0,
        codechefSolved: 0,
        githubContributions: 0,
        githubFollowers: 0,
        githubFollowing: 0,
        githubRepos: 0,
        overallScore: 0,
        totalSolved: 0,
      };
    };

    // 3. Process each packet sequentially to merge multiple updates for the same student correctly
    for (const packet of packets) {
      const { studentId, platform, status, data } = packet;

      // Track the fetch job status change
      fetchJobUpdates.push({ studentId, platform, status });

      const currentStats = getStats(studentId);
      const oldStats = { ...currentStats };

      let deltaSolved = 0;

      if (status === 'COMPLETED' && data) {
        // Merge the new data fields
        Object.assign(currentStats, data);

        // Recalculate totalSolved and overallScore
        const totalSolved = (currentStats.leetcodeSolved || 0) + 
                            (currentStats.codechefSolved || 0) + 
                            (currentStats.gfgSolved || 0);
        currentStats.totalSolved = totalSolved;
        currentStats.overallScore = totalSolved;

        // Calculate delta based on platform
        if (platform === 'leetcode') {
          deltaSolved = (currentStats.leetcodeSolved || 0) - (oldStats.leetcodeSolved || 0);
        } else if (platform === 'codechef') {
          deltaSolved = (currentStats.codechefSolved || 0) - (oldStats.codechefSolved || 0);
        } else if (platform === 'gfg') {
          deltaSolved = (currentStats.gfgSolved || 0) - (oldStats.gfgSolved || 0);
        }

        updatedStatsMap[studentId] = currentStats;
      }

      eventsToPublish.push({
        studentId,
        platform,
        status,
        oldStats,
        newStats: { ...currentStats },
        deltaSolved,
      });
    }

    // 4. Build database write operations
    const dbOperations: any[] = [];

    // Coding stats updates/upserts (exactly one per studentId in the transaction)
    for (const studentId of Object.keys(updatedStatsMap)) {
      const stats = updatedStatsMap[studentId];
      // Remove auto-generated columns before upsert
      const { id, updatedAt, ...statsFields } = stats;
      dbOperations.push(
        prisma.codingStats.upsert({
          where: { studentId },
          update: statsFields,
          create: statsFields,
        })
      );
    }

    // Fetch job updates (exactly one per studentId_platform in the transaction)
    const latestFetchJobs: Record<string, { studentId: string; platform: string; status: string }> = {};
    for (const job of fetchJobUpdates) {
      const key = `${job.studentId}:${job.platform}`;
      latestFetchJobs[key] = job;
    }

    for (const job of Object.values(latestFetchJobs)) {
      dbOperations.push(
        prisma.fetchJob.upsert({
          where: { studentId_platform: { studentId: job.studentId, platform: job.platform } },
          update: { status: job.status, lastRun: new Date() },
          create: { studentId: job.studentId, platform: job.platform, status: job.status, lastRun: new Date() },
        })
      );
    }

    // Execute bulk write concurrently in chunks instead of sequential $transaction
    // This avoids the 9+ second latency bottleneck over remote DB connections.
    if (dbOperations.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < dbOperations.length; i += chunkSize) {
        // await prisma.$transaction(dbOperations);
        const chunkOps = dbOperations.slice(i, i + chunkSize);
        await Promise.all(chunkOps);
      }
      logger.info(`Bulk DB write succeeded: updated ${Object.keys(updatedStatsMap).length} student stats and ${Object.keys(latestFetchJobs).length} fetch jobs.`);
    }

    // 5. Post-write execution: publish events and update Redis ZSET
    let hasScoreUpdates = false;
    for (const event of eventsToPublish) {
      // Publish event to Redis Pub/Sub
      await publishEvent('student:stats:updated', event);

      if (event.status === 'COMPLETED') {
        hasScoreUpdates = true;
        // Update Redis ZSET ranks
        await updateRedisStats(event.studentId, event.newStats.overallScore);
      }
    }

    // Increment leaderboard version once for the batch if there were any completed stats updates
    if (hasScoreUpdates) {
      await redisConnection.incr('leaderboard:version');
      logger.info('Incremented leaderboard:version to invalidate static cache.');
    }

  } catch (error: any) {
    logger.error('Failed to process buffer batch:', error);
  } finally {
    isProcessing = false;
  }
};

/**
 * Starts the DB Buffer Writer background worker.
 */
export const startDbWriter = (intervalMs = 5000) => {
  logger.info(`Starting DB Buffer Writer Service (polling every ${intervalMs}ms)`);
  
  const timer = setInterval(async () => {
    await processBufferBatch();
  }, intervalMs);

  return () => clearInterval(timer);
};
