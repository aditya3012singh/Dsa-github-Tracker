import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { subscribeEvent } from '../utils/event-bus';

/**
 * Starts the Time-Series Analytics Consumer.
 */
export const startAnalyticsConsumer = async () => {
  await subscribeEvent('student:stats:updated', async (event: any) => {
    const { studentId, platform, status, deltaSolved } = event;
    if (status !== 'COMPLETED' || deltaSolved <= 0) return;

    try {
      await prisma.statsHistory.create({
        data: {
          studentId,
          platform,
          solvedDelta: deltaSolved,
        },
      });
      logger.info(`Recorded stats history for student ${studentId}: +${deltaSolved} on ${platform}`);
    } catch (error: any) {
      logger.error(`Failed to record stats history for student ${studentId}:`, error);
    }
  });
};
