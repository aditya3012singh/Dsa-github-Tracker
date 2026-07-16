import client from "prom-client";
import { register } from "./registry";

export const studentRefreshTotal = new client.Counter({
    name: "coding_analytics_student_refresh_total",
    help: "Total student profile refreshes",
    labelNames: ["platform", "status"],
    registers: [register]
});

export const studentRefreshDuration = new client.Histogram({
    name: "coding_analytics_student_refresh_duration_seconds",
    help: "Student profile refresh duration",
    labelNames: ["platform"],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [register]
});

export const externalApiRequestsTotal = new client.Counter({
    name: "coding_analytics_external_api_requests_total",
    help: "Total external API requests",
    labelNames: ["platform", "status"],
    registers: [register]
});

export const externalApiDuration = new client.Histogram({
    name: "coding_analytics_external_api_duration_seconds",
    help: "External API request latency",
    labelNames: ["platform"],
    buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [register]
});

export const leaderboardRefreshTotal = new client.Counter({
    name: "coding_analytics_leaderboard_refresh_total",
    help: "Total leaderboard refreshes",
    registers: [register]
});

export const leaderboardRefreshDuration = new client.Histogram({
    name: "coding_analytics_leaderboard_refresh_duration_seconds",
    help: "Leaderboard refresh duration",
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register]
});
