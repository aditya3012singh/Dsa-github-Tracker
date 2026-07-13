import { Router } from "express";
import { register } from "../observability/metrics/registry";

const router = Router();

// Metrics endpoint for Prometheus scraping
router.get("/metrics", async (req, res) => {
    try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

// Basic application health check
router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date() });
});

export default router;
