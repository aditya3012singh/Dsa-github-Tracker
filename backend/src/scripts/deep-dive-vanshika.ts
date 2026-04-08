import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deepDive() {
  console.log('--- FINDING ALL USERS NAMED VANSHIKA ---');
  const vanshikas = await prisma.student.findMany({
    where: { name: { contains: 'Vanshika', mode: 'insensitive' } },
    include: { codingStats: true }
  });

  vanshikas.forEach(v => {
    console.log(`ID: ${v.id}, Name: ${v.name}, LibraryID: ${v.libraryId}`);
    console.log(`Stats Record: ${!!v.codingStats}, TotalSolved: ${v.codingStats?.totalSolved}, Score: ${v.codingStats?.overallScore}`);
  });

  console.log('\n--- TOP 5 BY TOTAL SOLVED (DESC) ---');
  const top = await prisma.student.findMany({
    orderBy: { codingStats: { totalSolved: 'desc' } },
    include: { codingStats: true },
    take: 5
  });

  top.forEach((s, i) => {
    console.log(`${i+1}. ${s.name} (ID: ${s.id}) - Total: ${s.codingStats?.totalSolved}`);
  });

  await prisma.$disconnect();
}

deepDive();
