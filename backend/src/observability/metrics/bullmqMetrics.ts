import client from "prom-client";
import { register } from "./registry";

export const queueJobsTotal = new client.Counter({
    name: "coding_analytics_queue_jobs_total",
    help: "Total jobs processed (started)",
    labelNames: ["queue"],
    registers: [register]
});

export const queueCompletedTotal = new client.Counter({
    name: "coding_analytics_queue_completed_total",
    help: "Total jobs completed successfully",
    labelNames: ["queue"],
    registers: [register]
});

export const queueFailuresTotal = new client.Counter({
    name: "coding_analytics_queue_failures_total",
    help: "Total jobs failed",
    labelNames: ["queue", "reason"],
    registers: [register]
});

export const queueRetriesTotal = new client.Counter({
    name: "coding_analytics_queue_retries_total",
    help: "Total jobs retried",
    labelNames: ["queue"],
    registers: [register]
});

export const queueDuration = new client.Histogram({
    name: "coding_analytics_queue_duration_seconds",
    help: "Queue job duration",
    labelNames: ["queue"],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [register]
});

export const queueWaitTime = new client.Histogram({
    name: "coding_analytics_queue_wait_time_seconds",
    help: "Queue job wait time before processing",
    labelNames: ["queue"],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
    registers: [register]
});

export const queueActiveJobs = new client.Gauge({
    name: "coding_analytics_queue_active_jobs",
    help: "Active jobs currently running",
    labelNames: ["queue"],
    registers: [register]
});
