import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  const studentsWithoutStats = await prisma.student.findMany({
    where: { codingStats: null }
  });

  console.log(`Found ${studentsWithoutStats.length} students without codingStats.`);

  for (const student of studentsWithoutStats) {
    await prisma.codingStats.create({
      data: {
        studentId: student.id,
        overallScore: 0,
        totalSolved: 0
      }
    });
    console.log(`Created stats for: ${student.name}`);
  }

  console.log('Cleanup complete.');
  await prisma.$disconnect();
}

cleanup();
