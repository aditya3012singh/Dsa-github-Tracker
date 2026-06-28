# 🏢 System Architecture

This document provides a detailed overview of the service architecture, communication channels, queue structure, and asynchronous processing pipeline of the KIET Coding Analytics Platform.

---

## 🗺️ System Overview Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT / FRONTEND                                 |
|                         (React, Redux Toolkit Query, Chart.js)                    |
+----------------------------------------+------------------------------------------+
                                         |
                                HTTP REST Requests
                                         |
                                         ▼
+-----------------------------------------------------------------------------------+
|                               EXPRESS API GATEWAY                                 |
|        - Request Validation       - Rate Limiting       - Cache Check             |
+-----+----------------------------------+------------------------------------+-----+
      |                                  |                                    |
      | Auth                             | Read Cache / Single-Flight         | Write / Queue Jobs
      ▼                                  ▼                                    ▼
+-----------+                    +---------------+                    +-------------+
|  Bcrypt   |                    |  Redis Cache  |                    |   BullMQ    |
|   JSON    |                    | (Leaderboard  |                    | statsQueue  |
| Web Token |                    |    & Profiles)|                    +------+------+
+-----------+                    +---------------+                           |
                                                                             | Job Handlers
                                                                             ▼
                                                                      +-------------+
                                                                      |   Workers   |
                                                                      | (Leetcode,  |
                                                                      | CF, Chef,   |
                                                                      | GFG, GitHub)|
                                                                      +------+------+
                                                                             | Push results
                                                                             ▼
                                                                      +-------------+
                                                                      |    Redis    |
                                                                      | db_write_   |
                                                                      |   buffer    |
                                                                      |   (List)    |
                                                                      +------+------+
                                                                             | Poll 5s
                                                                             ▼
+---------------------------+    Event Published    +------------------+     |
|       Redis Pub/Sub       |<----------------------|    DB Writer     |<----+
| (student:stats:updated)   |                       |    (Worker)      |
+-------------+-------------+                       +--------+---------+
              |                                              | Batch Transaction
              ▼                                              ▼
+---------------------------+                       +------------------+
|    WebSockets / Logger    |                       |    PostgreSQL    |
|    (Online status, logs)  |                       |  (Student, Stats)|
+---------------------------+                       +------------------+
```

---

## 🔄 Lifecycle of a Profile Update

A coding profile update (either triggered automatically by a cron job or manually by a user clicking "Sync All Stats") follows an asynchronous lifecycle to protect the database and third-party APIs from overload:

### 1. Request Stage
- The client triggers `POST /api/students/:id/fetch`.
- Express verifies the authentication token.
- Express enqueues scraping jobs to `statsQueue` via **BullMQ** (one job per platform handle config: LeetCode, GitHub, GfG, Codeforces, CodeChef).
- The student's fetch schedule score in Redis Sorted Set (`fetch_schedule`) is pushed forward by 11 hours to prevent abuse.

### 2. Scraping Stage
- Dedicated **BullMQ Workers** (`leetcode.worker.ts`, `github.worker.ts`, etc.) pick up the jobs.
- Workers request stats from third-party platform APIs, using proxy rotation and API keys configured in `.env`.
- Scraping results are formatted into a structured JSON payload.

### 3. Buffering Stage
- Instead of executing a SQL UPDATE query instantly, the worker pushes the results into a Redis List called `db_write_buffer`.
- This ensures database writes are non-blocking for worker operations.

### 4. Batch Writing Stage
- A background process (`db-writer.ts`) runs every 5 seconds.
- It pulls up to 100 items from `db_write_buffer` in a single batch.
- It aggregates duplicates (e.g. if a student got updates from multiple platforms in the same 5-second window, their updates are merged locally in memory).
- It executes a single database transaction (`prisma.$transaction`) to perform batch upserts on `CodingStats` and `FetchJob` status.

### 5. Invalidation & Notification Stage
- Once the database transaction succeeds:
  1. The DB Writer posts a message to Redis Pub/Sub channel `student:stats:updated`.
  2. The DB Writer updates the student's score in the Redis leaderboard sorted set.
  3. The DB Writer increments `leaderboard:version` in Redis to invalidate all static cached leaderboard query results.

---

## 🧩 Core Services

### API Service
- **Type**: Express App
- **Responsibilities**: User authentication, profile editing, exposing paginated leaderboard data, and manual fetch dispatching.

### Queue Worker Service
- **Type**: BullMQ Workers
- **Responsibilities**: Heavy asynchronous network I/O, fetching coding statistics, parsing HTML/JSON from external platforms, and proxy load-balancing.

### DB Write Buffer Service
- **Type**: Node polling loop
- **Responsibilities**: Reading raw buffer data from Redis, merging overlapping student stats updates in memory, and committing bulk writes to PostgreSQL.
