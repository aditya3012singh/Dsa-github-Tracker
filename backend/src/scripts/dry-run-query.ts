import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const LEADERBOARD_SELECT = {
  id: true,
  name: true,
  rollNo: true,
  libraryId: true,
  branch: true,
  year: true,
  section: true,
  codingStats: {
    select: {
      totalSolved: true,
      overallScore: true,
      leetcodeSolved: true,
      updatedAt: true
    }
  }
};

const mapStudentToLeaderboard = (student: any) => {
  const stats = student.codingStats;
  return {
    id: student.id,
    name: student.name,
    totalSolved: stats?.totalSolved || 0,
    score: stats?.overallScore || 0,
    updatedAt: stats?.updatedAt
  };
};

async function dryRun() {
  const where = { codingStats: { isNot: null } };
  const orderBy: any = { codingStats: { totalSolved: 'desc' } };
  
  console.log('--- EXECUTING CONTROLLER-STYLE QUERY ---');
  const students = await prisma.student.findMany({
    where,
    select: LEADERBOARD_SELECT,
    orderBy,
    take: 10
  });

  const leaderboardData = students.map(mapStudentToLeaderboard);

  console.log('Results:');
  leaderboardData.forEach((s, i) => {
    console.log(`${i+1}. ${s.name} - Total: ${s.totalSolved}, ID: ${s.id}`);
  });
  
  await prisma.$disconnect();
}

dryRun();
