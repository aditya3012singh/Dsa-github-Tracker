import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { subscribeEvent } from '../utils/event-bus';

/**
 * Starts the Weekly Goal Tracker Consumer.
 */
export const startGoalConsumer = async () => {
  await subscribeEvent('student:stats:updated', async (event: any) => {
    const { studentId, status, deltaSolved } = event;
    if (status !== 'COMPLETED' || deltaSolved <= 0) return;

    try {
      const now = new Date();
      
      // Find active, uncompleted goals for this student
      const activeGoals = await prisma.goal.findMany({
        where: {
          studentId,
          completed: false,
          startDate: { lte: now },
          endDate: { gte: now }
        }
      });

      for (const goal of activeGoals) {
        const newCount = goal.currentCount + deltaSolved;
        const isCompleted = newCount >= goal.targetCount;

        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            currentCount: newCount,
            completed: isCompleted
          }
        });

        logger.info(`Updated goal ${goal.id} for student ${studentId}: ${newCount}/${goal.targetCount} (${isCompleted ? 'COMPLETED' : 'IN_PROGRESS'})`);
      }
    } catch (error: any) {
      logger.error(`Failed to update goals for student ${studentId}:`, error);
    }
  });
};
