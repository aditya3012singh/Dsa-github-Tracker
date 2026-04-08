import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      codingStats: true
    },
    take: 10
  });

  console.log('Top 10 Students in DB (Raw Insertion Order):');
  students.forEach(s => {
    console.log(`${s.name}: Solved=${s.codingStats?.totalSolved}, StatsRecord=${!!s.codingStats}`);
  });

  const sorted = await prisma.student.findMany({
    where: {
      codingStats: { isNot: null }
    },
    orderBy: {
      codingStats: { totalSolved: 'desc' }
    },
    select: {
      name: true,
      codingStats: { select: { totalSolved: true } }
    },
    take: 5
  });

  console.log('\nSorted (Filtered by isNot: null):');
  sorted.forEach(s => console.log(`${s.name}: ${s.codingStats?.totalSolved}`));
  
  const sortedRaw = await prisma.student.findMany({
    orderBy: {
      codingStats: { totalSolved: 'desc' }
    },
    select: {
      name: true,
      codingStats: { select: { totalSolved: true } }
    },
    take: 5
  });

  console.log('\nSorted (Raw - likely with NULLs at top):');
  sortedRaw.forEach(s => console.log(`${s.name}: ${s.codingStats?.totalSolved}`));
  
  await prisma.$disconnect();
}

check();
