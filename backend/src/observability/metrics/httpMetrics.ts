import client from "prom-client";
import { register } from "./registry";

export const httpRequestsTotal = new client.Counter({

    name: "coding_analytics_http_requests_total",

    help: "Total HTTP requests",

    labelNames: [
        "method",
        "route",
        "status"
    ],

    registers: [register]

});

export const httpRequestDuration = new client.Histogram({

    name: "coding_analytics_http_request_duration_seconds",

    help: "HTTP request duration",

    labelNames: [
        "method",
        "route",
        "status"
    ],

    buckets: [
        0.005,
        0.01,
        0.05,
        0.1,
        0.3,
        0.5,
        1,
        2,
        5,
        10,
        30
    ],

    registers: [register]

});

export const inFlightRequests = new client.Gauge({

    name: "coding_analytics_http_requests_in_flight",

    help: "Current in-flight requests",

    registers: [register]

});

export const httpRequestErrorsTotal = new client.Counter({

    name: "coding_analytics_http_request_errors_total",

    help: "Total HTTP request errors (status >= 500)",

    labelNames: [
        "method",
        "route",
        "status"
    ],

    registers: [register]

});