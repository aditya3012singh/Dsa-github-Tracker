import { Redis } from "ioredis";
import { redisConnection } from "../../config/redis";
import { metrics } from "../../observability/metrics/metrics";

export enum CacheNamespace {
    Leaderboard = "leaderboard",
    Student = "student",
    Github = "github"
}

export enum RedisOperation {
    GET = "GET",
    SET = "SET",
    DEL = "DEL",
    MGET = "MGET",
    EXPIRE = "EXPIRE"
}

export class CacheService {
    constructor(private readonly redis: Redis) {}

    private async execute<T>(
        operation: RedisOperation,
        fn: () => Promise<T>
    ): Promise<T> {
        const timer = metrics.redis.startTimer(operation);
        try {
            return await fn();
        } catch (error) {
            metrics.redis.recordError(operation);
            throw error;
        } finally {
            timer();    
        }
    }

    async get(cache: CacheNamespace, key: string) {
        const value = await this.execute(RedisOperation.GET, () => this.redis.get(key));
        
        if (value !== null) {
            metrics.redis.recordHit(cache);
        } else {
            metrics.redis.recordMiss(cache);
        }
        
        return value;
    }

    async set(cache: CacheNamespace, key: string, value: string, ttlSeconds?: number) {
        await this.execute(RedisOperation.SET, async () => {
            if (ttlSeconds !== undefined) {
                await this.redis.set(key, value, "EX", ttlSeconds);
            } else {
                await this.redis.set(key, value);
            }
        });
    }

    async del(cache: CacheNamespace, key: string) {
        await this.execute(RedisOperation.DEL, () => this.redis.del(key));
    }

    async mget(cache: CacheNamespace, keys: string[]) {
        if (keys.length === 0) return [];
        const values = await this.execute(RedisOperation.MGET, () => this.redis.mget(...keys));
        
        values.forEach(v => {
            if (v !== null) metrics.redis.recordHit(cache);
            else metrics.redis.recordMiss(cache);
        });

        return values;
    }

    async expire(cache: CacheNamespace, key: string, ttlSeconds: number) {
        await this.execute(RedisOperation.EXPIRE, () => this.redis.expire(key, ttlSeconds));
    }

    async remember<T>(
        cache: CacheNamespace,
        key: string,
        ttlSeconds: number,
        fn: () => Promise<T>
    ): Promise<T> {
        const cachedValue = await this.get(cache, key);
        if (cachedValue !== null) {
            try {
                return JSON.parse(cachedValue) as T;
            } catch (err) {
                // metrics.redis.recordCorruptedCache(cache); // TODO: implement later
                await this.del(cache, key);
            }
        }

        const data = await fn();
        
        await this.set(cache, key, JSON.stringify(data), ttlSeconds);

        return data;
    }
}

export const cacheService = new CacheService(redisConnection);
