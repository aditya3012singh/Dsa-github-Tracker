import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { subscribeEvent } from '../utils/event-bus';

const standardBadges = [
  {
    name: "Century Club",
    description: "Solve 100 or more coding problems across platforms.",
    requirements: { type: "totalSolved", count: 100 }
  },
  {
    name: "Elite Coder",
    description: "Solve 500 or more coding problems across platforms.",
    requirements: { type: "totalSolved", count: 500 }
  },
  {
    name: "LeetCode Master",
    description: "Solve 100 or more problems on LeetCode.",
    requirements: { type: "leetcodeSolved", count: 100 }
  },
  {
    name: "GFG Centurion",
    description: "Solve 100 or more problems on GeeksforGeeks.",
    requirements: { type: "gfgSolved", count: 100 }
  },
  {
    name: "Steadfast Coder",
    description: "Maintain a consecutive daily coding streak of 7 days.",
    requirements: { type: "streak", count: 7 }
  },
  {
    name: "Weekend Warrior",
    description: "Solve a coding problem on a Saturday or Sunday.",
    requirements: { type: "weekend" }
  }
];

/**
 * Seed standard badges in the database if they do not exist.
 */
export const seedBadges = async () => {
  logger.info('Initializing standard badges seeding...');
  for (const badge of standardBadges) {
    try {
      await prisma.badge.upsert({
        where: { name: badge.name },
        update: {
          description: badge.description,
          requirements: badge.requirements as any,
        },
        create: {
          name: badge.name,
          description: badge.description,
          requirements: badge.requirements as any,
        }
      });
    } catch (error) {
      logger.error(`Failed to seed badge ${badge.name}:`, error);
    }
  }
  logger.info('Standard badges seeding finished.');
};

/**
 * Calculates consecutive daily coding streak for a student.
 */
export const calculateStreak = async (studentId: string): Promise<number> => {
  const history = await prisma.statsHistory.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' }
  });

  if (history.length === 0) return 0;

  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 10);
  };

  const solvedDates = new Set(
    history.map(h => getLocalDateString(new Date(h.createdAt)))
  );

  const today = new Date();
  const todayStr = getLocalDateString(today);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let startFrom: Date;
  if (solvedDates.has(todayStr)) {
    startFrom = today;
  } else if (solvedDates.has(yesterdayStr)) {
    startFrom = yesterday;
  } else {
    return 0; // Streak broken
  }

  let streak = 0;
  let checkDate = new Date(startFrom);

  while (true) {
    const checkStr = getLocalDateString(checkDate);
    if (solvedDates.has(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Starts the Badge and Streak Consumer.
 */
export const startBadgeConsumer = async () => {
  // Ensure badges are seeded on start
  await seedBadges();

  await subscribeEvent('student:stats:updated', async (event: any) => {
    const { studentId, status, newStats } = event;
    if (status !== 'COMPLETED') return;

    try {
      // 1. Fetch all badges
      const badges = await prisma.badge.findMany();
      
      // 2. Fetch badges already unlocked by student
      const unlockedBadges = await prisma.studentBadge.findMany({
        where: { studentId }
      });
      const unlockedBadgeIds = new Set(unlockedBadges.map(ub => ub.badgeId));

      // Lazy load streak calculation if needed
      let cachedStreak: number | null = null;
      const getOrCalculateStreak = async () => {
        if (cachedStreak !== null) return cachedStreak;
        cachedStreak = await calculateStreak(studentId);
        return cachedStreak;
      };

      // 3. Evaluate requirements
      for (const badge of badges) {
        if (unlockedBadgeIds.has(badge.id)) continue;

        const req: any = badge.requirements;
        let isEligible = false;

        if (req.type === 'totalSolved') {
          isEligible = (newStats.totalSolved || 0) >= req.count;
        } else if (req.type === 'leetcodeSolved') {
          isEligible = (newStats.leetcodeSolved || 0) >= req.count;
        } else if (req.type === 'gfgSolved') {
          isEligible = (newStats.gfgSolved || 0) >= req.count;
        } else if (req.type === 'streak') {
          const streak = await getOrCalculateStreak();
          isEligible = streak >= req.count;
        } else if (req.type === 'weekend') {
          const day = new Date().getDay();
          isEligible = (day === 0 || day === 6); // Sunday or Saturday
        }

        if (isEligible) {
          try {
            await prisma.studentBadge.create({
              data: {
                studentId,
                badgeId: badge.id
              }
            });
            logger.info(`Student ${studentId} unlocked badge: ${badge.name}`);
          } catch (createErr: any) {
            // Handle race condition where badge was created concurrently
            if (createErr.code !== 'P2002') {
              logger.error(`Error saving unlocked badge ${badge.name} for student ${studentId}:`, createErr);
            }
          }
        }
      }
    } catch (error: any) {
      logger.error(`Failed to process badges for student ${studentId}:`, error);
    }
  });
};
