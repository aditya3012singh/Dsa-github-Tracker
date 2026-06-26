import { logger } from '../utils/logger';
import { startAnalyticsConsumer } from './analytics.consumer';
import { startBadgeConsumer } from './badge.consumer';
import { startGoalConsumer } from './goal.consumer';

/**
 * Initializes and starts all Redis Pub/Sub event consumers.
 */
export const startConsumers = async () => {
  logger.info('Initializing all background event consumers...');
  try {
    await startAnalyticsConsumer();
    await startBadgeConsumer();
    await startGoalConsumer();
    logger.info('All background event consumers initialized successfully.');
  } catch (error: any) {
    logger.error('Failed to initialize background event consumers:', error);
  }
};
