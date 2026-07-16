import { redisConnection } from "../../config/redis";
import {
    cacheHitsTotal,
    cacheMissesTotal,
    redisOperationDuration,
    redisErrorsTotal
} from "../../observability/metrics/redisMetrics";

class RedisCacheService {
    /**
     * Get a value from the Redis cache
     * @param cacheName - The cache zone name (e.g. 'leaderboard') for metrics categorization
     * @param key - The cache key
     */
    async get(cacheName: string, key: string): Promise<string | null> {
        const start = process.hrtime.bigint();
        try {
            const result = await redisConnection.get(key);
            const duration = Number(process.hrtime.bigint() - start) / 1e9;
            redisOperationDuration.observe({ operation: "get" }, duration);

            if (result !== null) {
                cacheHitsTotal.inc({ cache: cacheName });
            } else {
                cacheMissesTotal.inc({ cache: cacheName });
            }

            return result;
        } catch (err) {
            const duration = Number(process.hrtime.bigint() - start) / 1e9;
            redisOperationDuration.observe({ operation: "get" }, duration);
            redisErrorsTotal.inc({ operation: "get" });
            throw err;
        }
    }

    /**
     * Set a value in the Redis cache with an optional TTL
     * @param cacheName - The cache zone name (e.g. 'leaderboard') for metrics categorization
     * @param key - The cache key
     * @param value - The value to cache
     * @param ttlSeconds - Time to live in seconds
     */
    async set(
        cacheName: string,
        key: string,
        value: string,
        ttlSeconds?: number
    ): Promise<void> {
        const start = process.hrtime.bigint();
        try {
            if (ttlSeconds !== undefined && ttlSeconds > 0) {
                await redisConnection.setex(key, ttlSeconds, value);
            } else {
                await redisConnection.set(key, value);
            }
            const duration = Number(process.hrtime.bigint() - start) / 1e9;
            redisOperationDuration.observe({ operation: "set" }, duration);
        } catch (err) {
            const duration = Number(process.hrtime.bigint() - start) / 1e9;
            redisOperationDuration.observe({ operation: "set" }, duration);
            redisErrorsTotal.inc({ operation: "set" });
            throw err;
        }
    }

    /**
     * Delete a value from the Redis cache
     * @param cacheName - The cache zone name (e.g. 'leaderboard') for metrics categorization
     * @param key - The cache key
     */
    async del(cacheName: string, key: string): Promise<void> {
        const start = process.hrtime.bigint();
        try {
            await redisConnection.del(key);
            const duration = Number(process.hrtime.bigint() - start) / 1e9;
            redisOperationDuration.observe({ operation: "del" }, duration);
        } catch (err) {
            const duration = Number(process.hrtime.bigint() - start) / 1e9;
            redisOperationDuration.observe({ operation: "del" }, duration);
            redisErrorsTotal.inc({ operation: "del" });
            throw err;
        }
    }
}

export const cache = new RedisCacheService();
export default cache;
