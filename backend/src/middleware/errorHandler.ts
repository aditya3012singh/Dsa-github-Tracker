import { Request, Response, NextFunction } from "express";
import { logger } from "../observability/logger/logger";

export const errorHandler = (

    err: any,

    req: Request,

    res: Response,

    next: NextFunction

) => {

    const status = err.status ?? 500;

    const duration = Date.now() - req.startTime;

    logger.error("Unhandled Exception", {

        requestId: req.requestId,

        traceId: req.traceId,

        method: req.method,

        url: req.originalUrl,

        params: req.params,

        query: req.query,

        status,

        duration_ms: duration,

        userId: req.user?.id ?? null,

        ip: req.ip,

        userAgent: req.get("user-agent"),

        errorName: err.name,

        errorMessage: err.message,

        stack: err.stack

    });

    res.status(status).json({

        status: "error",

        message:

            process.env.NODE_ENV === "production"

                ? "Internal Server Error"

                : err.message,

        ...(process.env.NODE_ENV === "development" && {

            stack: err.stack

        })

    });

};