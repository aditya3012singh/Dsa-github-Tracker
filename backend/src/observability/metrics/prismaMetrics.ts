import client from "prom-client";
import { register } from "./registry";

export const prismaQueriesTotal = new client.Counter({
    name: "coding_analytics_prisma_queries_total",
    help: "Total Prisma queries",
    labelNames: ["model", "operation", "status"],
    registers: [register]
});

export const prismaQueryDuration = new client.Histogram({
    name: "coding_analytics_prisma_query_duration_seconds",
    help: "Prisma query duration",
    labelNames: ["model", "operation"],
    buckets: [
        0.005,
        0.01,
        0.05,
        0.1,
        0.3,
        0.5,
        1,
        2,
        5
    ],
    registers: [register]
});

export const prismaSlowQueriesTotal = new client.Counter({
    name: "coding_analytics_prisma_slow_queries_total",
    help: "Slow Prisma queries",
    labelNames: ["model", "operation"],
    registers: [register]
});

export const prismaErrorsTotal = new client.Counter({
    name: "coding_analytics_prisma_errors_total",
    help: "Prisma query errors",
    labelNames: ["model", "operation"],
    registers: [register]
});
