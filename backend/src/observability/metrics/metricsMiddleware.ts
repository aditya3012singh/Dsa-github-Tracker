import { Request, Response, NextFunction } from "express";
import { httpRequestsTotal, httpRequestDuration, inFlightRequests, httpRequestErrorsTotal } from "./httpMetrics";

export function metricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const ignoredRoutes = [
        "/metrics",
        "/health",
        "/ready",
        "/live"
    ];

    if (ignoredRoutes.includes(req.path)) {
        return next();
    }

    // 1. Increment the in-flight gauge immediately
    inFlightRequests.inc();

    const start = process.hrtime.bigint();
    let finished = false;

    const recordMetrics = () => {
        if (finished) return;
        finished = true;

        const durationInSeconds = Number(process.hrtime.bigint() - start) / 1e9;

        // Resolve route pattern (e.g. /api/students/:id instead of /api/students/1)
        // This avoids high-cardinality URL explosion in Prometheus.
        let route = "unmatched_route";
        if (req.route?.path) {
            route = `${req.baseUrl}${req.route.path}`;
        }

        const labels = {
            method: req.method,
            route,
            status: String(res.statusCode)
        } as const;

        // 2. Increment the request counter
        httpRequestsTotal.inc(labels);

        // 3. Record the histogram duration in seconds
        httpRequestDuration.observe(labels, durationInSeconds);

        // 4. Increment the error counter if the status code is >= 500
        if (res.statusCode >= 500) {
            httpRequestErrorsTotal.inc(labels);
        }

        // 5. Decrement the in-flight gauge
        inFlightRequests.dec();
    };

    // Listen to both finish and close to prevent gauge leaks if the client disconnects prematurely
    res.on("finish", recordMetrics);
    res.on("close", recordMetrics);

    next();
}
