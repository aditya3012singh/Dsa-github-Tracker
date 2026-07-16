import {
    httpRequestsTotal,
    httpRequestDuration,
    inFlightRequests,
    httpRequestErrorsTotal
} from "./httpMetrics";

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
        recordHit(key: string) {
            // TODO
        },
        recordMiss(key: string) {
            // TODO
        },
        recordLatency(operation: string, durationSeconds: number) {
            // TODO
        },
        recordError(operation: string) {
            // TODO
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
