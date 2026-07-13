import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { logger } from "../observability/logger/logger";

export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
) {

    req.requestId = uuid();

    // Trace ID: extract from headers (x-trace-id or traceparent) or generate a 32-character hex string
    const traceparent = req.headers["traceparent"] as string;
    const incomingTraceId = (req.headers["x-trace-id"] as string) || 
                            (traceparent ? traceparent.split("-")[1] : undefined);
    
    req.traceId = incomingTraceId || uuid().replace(/-/g, "");

    req.startTime = Date.now();

    // Expose trace and request IDs in headers
    res.setHeader("x-request-id", req.requestId);
    res.setHeader("x-trace-id", req.traceId);

    res.on("finish", () => {

        const duration = Date.now() - req.startTime;

        logger.info("HTTP Request Completed", {

            requestId: req.requestId,

            traceId: req.traceId,

            method: req.method,

            url: req.originalUrl,

            status: res.statusCode,

            duration_ms: duration,

            responseSize: res.getHeader("content-length") !== undefined ? Number(res.getHeader("content-length")) : null,

            ip: req.ip,

            userAgent: req.get("user-agent"),

            userId: req.user?.id ?? null

        });

    });

    next();

}