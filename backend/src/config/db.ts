import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    logger.info('Successfully connected to Postgres database via Prisma.');
  })
  .catch((err: any) => {
    logger.error('Failed to connect to the Postgres database:', err);
  });
