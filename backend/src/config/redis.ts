import Redis from 'ioredis';
import { logger } from '../utils/logger';

const rawRedisURL = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

const normalizeRedisUrl = (url?: string) => {
  if (!url) return undefined;
  const trimmed = url.trim();

  // Upstash requires TLS; if misconfigured with redis://, force rediss:// to avoid ECONNRESET loops.
  if (/^redis:\/\//i.test(trimmed) && /upstash\.io/i.test(trimmed)) {
    logger.warn('REDIS_URL is using redis:// for Upstash. Switching to rediss:// automatically.');
    return trimmed.replace(/^redis:\/\//i, 'rediss://');
  }

  return trimmed;
};

const redisURL = normalizeRedisUrl(rawRedisURL);

const commonRedisOptions = {
  maxRetriesPerRequest: null as null,
  connectTimeout: 10000,
  keepAlive: 30000,
  retryStrategy: (times: number) => Math.min(times * 250, 5000),
};

export const redisConnection = redisURL
  ? new Redis(redisURL, commonRedisOptions)
  : new Redis({
    host: redisHost,
    port: redisPort,
    ...commonRedisOptions,
  });

redisConnection.once('connect', () => {
  logger.info('Connected to Redis server.');
});

redisConnection.on('reconnecting', (delay: number) => {
  logger.warn(`Redis reconnecting in ${delay}ms`);
});

redisConnection.on('end', () => {
  logger.warn('Redis connection closed.');
});

redisConnection.on('error', (err) => {
  logger.error('Redis connection error:', err);
});
