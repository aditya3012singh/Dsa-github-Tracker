import client from "prom-client";

export const register = new client.Registry();

// Collect Node.js runtime metrics
client.collectDefaultMetrics({
    register,
    prefix: "coding_analytics_"
});