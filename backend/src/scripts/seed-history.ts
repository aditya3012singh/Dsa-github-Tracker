import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedHistory() {
  console.log('--- SEEDING RANK HISTORY ---');
  const students = await prisma.student.findMany({
    include: { codingStats: true },
    take: 50
  });

  const now = new Date();
  const historyData = [];

  for (const student of students) {
    if (!student.codingStats) continue;
    
    // Generate 7 days of history
    for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        
        // Randomize rank slightly to show movement
        // Let's assume baseline rank is their index + 10
        const baseRank = students.indexOf(student) + 1;
        const randomRank = Math.max(1, baseRank + Math.floor(Math.random() * 10) - 5);

        historyData.push({
            studentId: student.id,
            rank: randomRank,
            score: student.codingStats.overallScore,
            createdAt: date
        });
    }
  }

  await prisma.rankHistory.createMany({
    data: historyData
  });

  console.log(`Seeded ${historyData.length} history records.`);
  await prisma.$disconnect();
}

seedHistory();
