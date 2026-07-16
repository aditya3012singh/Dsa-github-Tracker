import client from "prom-client";
import { register } from "./registry";

export const cacheHitsTotal = new client.Counter({
    name: "coding_analytics_cache_hits_total",
    help: "Total cache hits",
    labelNames: ["cache"],
    registers: [register]
});

export const cacheMissesTotal = new client.Counter({
    name: "coding_analytics_cache_misses_total",
    help: "Total cache misses",
    labelNames: ["cache"],
    registers: [register]
});

export const redisOperationDuration = new client.Histogram({
    name: "coding_analytics_redis_operation_duration_seconds",
    help: "Redis operation duration",
    labelNames: ["operation"],
    buckets: [
        0.001,
        0.005,
        0.01,
        0.05,
        0.1,
        0.5,
        1
    ],
    registers: [register]
});

export const redisErrorsTotal = new client.Counter({
    name: "coding_analytics_redis_errors_total",
    help: "Total Redis errors",
    labelNames: ["operation"],
    registers: [register]
});
