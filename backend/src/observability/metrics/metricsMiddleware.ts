import { Request, Response, NextFunction } from "express";
import { httpRequestsTotal, httpRequestDuration, inFlightRequests } from "./httpMetrics";

export function metricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // 1. Increment the in-flight gauge immediately
    inFlightRequests.inc();

    const start = process.hrtime();
    let finished = false;

    const recordMetrics = () => {
        if (finished) return;
        finished = true;

        const diff = process.hrtime(start);
        const durationInSeconds = diff[0] + diff[1] / 1e9;

        // Resolve route pattern (e.g. /api/students/:id instead of /api/students/1)
        // This avoids high-cardinality URL explosion in Prometheus.
        let route = "unknown";
        if (req.route?.path) {
            route = `${req.baseUrl}${req.route.path}`;
        } else if (res.statusCode === 404) {
            route = "not_found";
        }

        const labels = {
            method: req.method,
            route,
            status: res.statusCode.toString()
        };

        // 2. Increment the request counter
        httpRequestsTotal.inc(labels);

        // 3. Record the histogram duration in seconds
        httpRequestDuration.observe(labels, durationInSeconds);

        // 4. Decrement the in-flight gauge
        inFlightRequests.dec();
    };

    // Listen to both finish and close to prevent gauge leaks if the client disconnects prematurely
    res.on("finish", recordMetrics);
    res.on("close", recordMetrics);

    next();
}
