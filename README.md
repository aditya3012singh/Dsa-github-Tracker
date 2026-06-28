# 🚀 KIET Coding Analytics Platform

A scalable coding analytics platform serving 3,000+ students, aggregating competitive programming statistics from multiple coding platforms into a unified leaderboard.

---

## 📖 Overview

**KIET Coding Analytics Platform** is a backend-first application built to help students track their coding journey across multiple platforms through a single dashboard.

The platform periodically collects coding statistics, ranks students on a college-wide leaderboard, and provides profile analytics while handling thousands of users efficiently.

Designed with scalability in mind, the platform leverages asynchronous processing, event-driven architecture, distributed caching, and background workers to minimize latency and reduce database load.

---

## ✨ Features
* 📊 **College-wide coding leaderboard** - Unified rankings sorted by overall statistics, platform performance, or search keywords.
* 👨‍💻 **Unified coding profile** - Aggregate stats, solved count delta, and performance metrics in one single profile view.
* 🔄 **Automatic profile synchronization** - Periodic sync schedules to update handles automatically.
* ⚡ **Manual profile refresh** - On-demand synchronization of statistics directly via profile sync.
* 🔥 **Real-time online status** - Monitor active coding platform session updates.
* 🔍 **Search students** - Rapid lookup of students by name, branch, year, or library ID.
* 🔗 **LinkedIn & GitHub profile integration** - Seamless linking to professional networks directly from the leaderboard.
* 📈 **Coding platform analytics** - Historically tracked metrics and rank evolution charts.

---

## 🌐 Supported Platforms
* **LeetCode**
* **Codeforces**
* **GeeksforGeeks**
* **GitHub**
* **LinkedIn**

---

## 🏗 Architecture

The platform follows an event-driven architecture.

```
                    +------------------+
                    |      Client      |
                    +--------+---------+
                             |
                             |
                      REST API (Express)
                             |
           +-----------------+-----------------+
           |                                   |
           | Emits Events                      |
           |                                   |
           ▼                                   ▼
   Leaderboard Service                 Profile Service
           |                                   |
           +-----------------+-----------------+
                             |
                       BullMQ Workers
                             |
                    Fetch External APIs
                             |
                      Batch Processing (Redis List)
                             |
                       PostgreSQL (Prisma)
                             |
                          Redis Cache
```

Services communicate asynchronously through events, allowing each component to scale and evolve independently.

For a detailed breakdown of the components, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ⚡ Tech Stack

* **Backend**: Node.js, Express.js, TypeScript, Prisma ORM
* **Frontend**: React, TypeScript, Redux Toolkit Query, Tailwind CSS, Framer Motion
* **Database**: PostgreSQL (hosted on Neon)
* **Caching**: Redis / Valkey
* **Queue**: BullMQ (asynchronous stats scraping & job coordination)
* **Observability**: Winston Logger, Prometheus, Grafana

---

## 🚀 Scalability

The platform is designed to support large numbers of concurrent users.

### Event-Driven Architecture
Instead of synchronous service communication, services emit events after completing their responsibilities. This enables loose coupling, independent deployments, and better fault tolerance.

### Background Workers & Buffer Queue
All statistics scraper jobs run in background worker threads managed by BullMQ. Handlers fetch stats asynchronously and push completed updates into a Redis write buffer list (`db_write_buffer`).

### Batch Processing
Instead of writing every fetched profile individually:
```
[ 50+ Incoming Profile Updates ]
              ↓
  Stored in Redis Write Buffer
              ↓ (Every 5 seconds)
  Merged & Batch Upserted in a Single SQL Transaction
              ↓
        PostgreSQL DB
```
This batching mechanism dramatically reduces active database connections and I/O overhead.

### Redis Caching & Stampede Prevention
* **Cache-Aside Pattern**: Leaderboards and student profile objects are cached inside Redis.
* **Request Coalescing (Single Flight)**: When a cache miss occurs, only one database query is issued for a given key. Subsequent concurrent requests are coalesced to wait for the same database query promise, completely preventing database cache stampedes.

For detailed caching strategies, see [CACHE.md](docs/CACHE.md).

---

## 📈 Observability

Production monitoring features include:
* API Latency & throughput tracking.
* Cache Hit/Miss ratio tracking.
* Worker Queue throughput and retry diagnostics.
* Real-time logs using Winston with configured retention policies.

---

## 📁 Project Documentation

To read more about the technical designs and scaling strategies, check out:

* 🏢 **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Detailed overview of services, communication patterns, and queue workflow.
* 💾 **[DATABASE.md](docs/DATABASE.md)** — Database models, schema design, indexes, and write buffering.
* ⚡ **[CACHE.md](docs/CACHE.md)** — Redis design, Cache-Aside pattern, and Cache Stampede prevention.
* 🔔 **[EVENT_DRIVEN.md](docs/EVENT_DRIVEN.md)** — Events, Pub/Sub channels, worker patterns, and stats delta logging.
* 📈 **[SCALING.md](docs/SCALING.md)** — Future plans for scaling to 100K+ and 1M+ active users.
* 🔌 **[API.md](docs/API.md)** — Endpoint request and response documentation.

---

## 👨‍💻 Author

**Aditya Singh**
* *Backend Engineer passionate about scalable systems, distributed architectures, and high-performance backend development.*
* **GitHub**: [@aditya3012singh](https://github.com/aditya3012singh)
* **LinkedIn**: [Aditya Singh](https://www.linkedin.com/in/aditya-singh-8b8045345/)
