import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisURL = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

export const redisConnection = redisURL
  ? new Redis(redisURL, { maxRetriesPerRequest: null })
  : new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
  });

redisConnection.on('connect', () => {
  logger.info('Connected to Redis server.');
});

redisConnection.on('error', (err) => {
  logger.error('Redis connection error:', err);
});
