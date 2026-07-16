import client from "prom-client";
import { register } from "./registry";

export const queueJobsStartedTotal = new client.Counter({
    name: "coding_analytics_queue_jobs_started_total",
    help: "Total jobs started",
    labelNames: ["queue"],
    registers: [register]
});

export const queueJobsCompletedTotal = new client.Counter({
    name: "coding_analytics_queue_jobs_completed_total",
    help: "Total jobs completed",
    labelNames: ["queue"],
    registers: [register]
});

export const queueJobsFailedTotal = new client.Counter({
    name: "coding_analytics_queue_jobs_failed_total",
    help: "Total jobs failed",
    labelNames: ["queue", "reason"],
    registers: [register]
});

export const queueJobsRetriedTotal = new client.Counter({
    name: "coding_analytics_queue_jobs_retried_total",
    help: "Total jobs retried",
    labelNames: ["queue"],
    registers: [register]
});

export const queueJobDuration = new client.Histogram({
    name: "coding_analytics_queue_job_duration_seconds",
    help: "Queue job duration",
    labelNames: ["queue"],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [register]
});

export const queueActiveJobs = new client.Gauge({
    name: "coding_analytics_queue_active_jobs",
    help: "Active jobs currently running",
    labelNames: ["queue"],
    registers: [register]
});
