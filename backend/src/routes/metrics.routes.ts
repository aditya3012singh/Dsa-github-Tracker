import { Router } from "express";
import { register } from "../observability/metrics/registry";

const router = Router();
// these two lines to be removed
// import { redisConnection } from "../config/redis";
// import { redisQueueLength } from "../observability/metrics/redisMetrics";

import { redisConnection } from "../config/redis";
import { redisQueueLength } from "../observability/metrics/redisMetrics";

// Metrics endpoint for Prometheus scraping
router.get("/metrics", async (req, res) => {
    try {
        // Dynamically measure the queue size just before Prometheus scrapes it // next two lines is to be removed 
        const bufferSize = await redisConnection.llen('db_write_buffer');
        redisQueueLength.labels('db_write_buffer').set(bufferSize);

        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(String(err));
    }
});

// Basic application health check
router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date() });
});

export default router;
