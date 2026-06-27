import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { redisConnection, redisSubscriber } from '../config/redis';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../data/alldata.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Error: alldata.json not found in src/data/');
    console.log('Please run "npm run merge:data" first to compile the merged dataset.');
    process.exit(1);
  }

  // 1. Check for clear flag
  const clearDb = process.argv.includes('--clear');
  if (clearDb) {
    console.log('=== DATABASE RESET (--clear option detected) ===');
    
    console.log('Clearing database tables...');
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
    console.log('Redis cache flushed successfully.');
  }

  // 2. Read merged student data
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const students = JSON.parse(rawData);
  console.log(`\nFound ${students.length} students in alldata.json to seed.`);

  // Hash password once to save performance during loop
  const hashedPassword = await bcrypt.hash('password123', 10);

  let successCount = 0;
  let errorCount = 0;

  const BATCH_SIZE = 8;
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (student: any) => {
      const { libraryId, name, rollNo, email, branch, year, section } = student;
      try {
        await prisma.student.upsert({
          where: { libraryId },
          update: {
            name,
            rollNo,
            email,
            branch,
            year,
            section,
            leetcodeHandle: student.leetcodeHandle,
            codeforcesHandle: student.codeforcesHandle,
            codechefHandle: student.codechefHandle,
            gfgHandle: student.gfgHandle,
            githubHandle: student.githubHandle,
          },
          create: {
            name,
            libraryId,
            rollNo,
            email,
            branch,
            year,
            section,
            password: hashedPassword,
            leetcodeHandle: student.leetcodeHandle,
            codeforcesHandle: student.codeforcesHandle,
            codechefHandle: student.codechefHandle,
            gfgHandle: student.gfgHandle,
            githubHandle: student.githubHandle,
            codingStats: {
              create: {}
            }
          }
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to seed student libraryId: ${libraryId} (${name}): ${err.message}`);
        errorCount++;
      }
    }));
    console.log(`Processed batch ${Math.min(i + BATCH_SIZE, students.length)} / ${students.length} students...`);
  }

  console.log('\n--- Seeding Process Finished ---');
  console.log(`Successfully seeded/updated: ${successCount}`);
  console.log(`Failed due to errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error('Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    try {
      await redisConnection.quit();
      await redisSubscriber.quit();
    } catch (err) {
      // Ignore
    }
    console.log('Database and Redis connections closed cleanly.');
  });
