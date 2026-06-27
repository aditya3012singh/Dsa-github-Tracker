import { PrismaClient } from '@prisma/client';
import { redisConnection, redisSubscriber } from '../config/redis';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  
  // Delete all records in correct order of dependency
  const studentBadgeCount = await prisma.studentBadge.deleteMany({});
  console.log(`Deleted ${studentBadgeCount.count} StudentBadge records`);

  const badgeCount = await prisma.badge.deleteMany({});
  console.log(`Deleted ${badgeCount.count} Badge records`);

  const codingStatsCount = await prisma.codingStats.deleteMany({});
  console.log(`Deleted ${codingStatsCount.count} CodingStats records`);

  const goalCount = await prisma.goal.deleteMany({});
  console.log(`Deleted ${goalCount.count} Goal records`);

  const fetchJobCount = await prisma.fetchJob.deleteMany({});
  console.log(`Deleted ${fetchJobCount.count} FetchJob records`);

  const rankHistoryCount = await prisma.rankHistory.deleteMany({});
  console.log(`Deleted ${rankHistoryCount.count} RankHistory records`);

  const statsHistoryCount = await prisma.statsHistory.deleteMany({});
  console.log(`Deleted ${statsHistoryCount.count} StatsHistory records`);

  const studentCount = await prisma.student.deleteMany({});
  console.log(`Deleted ${studentCount.count} Student records`);

  console.log('Clearing Redis cache...');
  await redisConnection.flushall();
  console.log('Redis cache flushed successfully!');

  console.log('Database and cache cleared successfully!');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    try {
      await redisConnection.quit();
      await redisSubscriber.quit();
    } catch (err) {
      console.error('Error disconnecting Redis:', err);
    }
  });
