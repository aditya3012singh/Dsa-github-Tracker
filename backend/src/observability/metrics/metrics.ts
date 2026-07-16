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
        recordQuery(durationSeconds: number) {
            // TODO
        },
        recordSlowQuery(durationSeconds: number) {
            // TODO
        },
        recordTransaction(durationSeconds: number) {
            // TODO
        }
    },

    queue: {
        jobStarted() {
            // TODO
        },
        jobCompleted() {
            // TODO
        },
        jobFailed() {
            // TODO
        },
        jobRetried() {
            // TODO
        }
    },

    business: {
        studentSyncSuccess() {
            // TODO
        },
        studentSyncFailure() {
            // TODO
        },
        leaderboardRefresh(durationSeconds: number) {
            // TODO
        },
        leetcodeApiFailure() {
            // TODO
        }
    }
};
