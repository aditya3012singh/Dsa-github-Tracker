import {
    httpRequestsTotal,
    httpRequestDuration,
    inFlightRequests,
    httpRequestErrorsTotal
} from "./httpMetrics";
import {
    cacheHitsTotal,
    cacheMissesTotal,
    redisErrorsTotal,
    redisOperationDuration
} from "./redisMetrics";
import {
    prismaQueriesTotal,
    prismaQueryDuration,
    prismaSlowQueriesTotal,
    prismaErrorsTotal
} from "./prismaMetrics";
import {
    queueJobsStartedTotal,
    queueJobsCompletedTotal,
    queueJobsFailedTotal,
    queueJobsRetriedTotal,
    queueJobDuration,
    queueActiveJobs,
    queueJobWaitTime
} from "./bullmqMetrics";
import {
    studentRefreshTotal,
    studentRefreshDuration,
    externalApiRequestsTotal,
    externalApiDuration,
    leaderboardRefreshTotal,
    leaderboardRefreshDuration
} from "./businessMetrics";

// Moved types to types.ts to avoid circular dependencies if needed, or defined inline:
export enum ExternalApiResult {
    SUCCESS = "SUCCESS",
    RATE_LIMIT = "RATE_LIMIT",
    TIMEOUT = "TIMEOUT",
    NOT_FOUND = "NOT_FOUND",
    SERVER_ERROR = "SERVER_ERROR",
    UNKNOWN = "UNKNOWN"
}

export type HttpLabels = {
    method: string;
    route: string;
    status: string;
};

export const metrics = {
    http: {
        requestStarted() {
            inFlightRequests.inc();
        },

        requestCompleted(labels: HttpLabels, durationSeconds: number) {
            inFlightRequests.dec();
            httpRequestsTotal.inc(labels);
            httpRequestDuration.observe(labels, durationSeconds);
        },

        requestFailed(labels: HttpLabels) {
            httpRequestErrorsTotal.inc(labels);
        }
    },

    redis: {
        recordHit(cache: string) {
            cacheHitsTotal.inc({ cache });
        },
        recordMiss(cache: string) {
            cacheMissesTotal.inc({ cache });
        },
        recordError(operation: string) {
            redisErrorsTotal.inc({ operation });
        },
        startTimer(operation: string) {
            const start = process.hrtime.bigint();
            return () => {
                const duration = Number(process.hrtime.bigint() - start) / 1e9;
                redisOperationDuration.observe({ operation }, duration);
            };
        }
    },

    prisma: {
        recordQuery(model: string, operation: string, status: string) {
            prismaQueriesTotal.inc({ model, operation, status });
        },
        recordDuration(model: string, operation: string, durationSeconds: number) {
            prismaQueryDuration.observe({ model, operation }, durationSeconds);
        },
        recordSlowQuery(model: string, operation: string) {
            prismaSlowQueriesTotal.inc({ model, operation });
        },
        recordError(model: string, operation: string) {
            prismaErrorsTotal.inc({ model, operation });
        }
    },

    queue: {
        jobStarted(queue: string) {
            queueJobsStartedTotal.inc({ queue });
        },
        jobCompleted(queue: string) {
            queueJobsCompletedTotal.inc({ queue });
        },
        jobFailed(queue: string, reason: string) {
            queueJobsFailedTotal.inc({ queue, reason });
        },
        jobRetried(queue: string) {
            queueJobsRetriedTotal.inc({ queue });
        },
        recordDuration(queue: string, durationSeconds: number) {
            queueJobDuration.observe({ queue }, durationSeconds);
        },
        recordWaitTime(queue: string, waitTimeSeconds: number) {
            queueJobWaitTime.observe({ queue }, waitTimeSeconds);
        },
        incActiveJobs(queue: string) {
            queueActiveJobs.inc({ queue });
        },
        decActiveJobs(queue: string) {
            queueActiveJobs.dec({ queue });
        }
    },

    business: {
        startStudentRefresh(platform: string) {
            const start = process.hrtime.bigint();
            return (success: boolean) => {
                const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
                studentRefreshTotal.inc({ platform, status: success ? "success" : "failure" });
                studentRefreshDuration.observe({ platform }, durationSeconds);
            };
        },
        externalApi(platform: string, status: ExternalApiResult | string) {
            externalApiRequestsTotal.inc({ platform, status });
        },
        externalApiLatency(platform: string, durationSeconds: number) {
            externalApiDuration.observe({ platform }, durationSeconds);
        },
        leaderboardRefresh(durationSeconds: number) {
            leaderboardRefreshTotal.inc();
            leaderboardRefreshDuration.observe(durationSeconds);
        }
    }
};
