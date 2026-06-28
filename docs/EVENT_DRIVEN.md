# 🔔 Event-Driven Processing & Workers

This document describes how stats aggregation jobs are scheduled, executed, retried, and how downstream system components react to profile updates through internal events.

---

## 🕒 Scraper Queue Pipeline (BullMQ)

Statistics scraping is handled asynchronously via **BullMQ** over Redis.

```
       Express API / Cron Scheduler
                    │
            Enqueues Job into
                    ▼
          [ BullMQ: statsQueue ]
           /        │         \
          /         │          \
         ▼          ▼           ▼
  LeetCode       GitHub     Codeforces
   Worker        Worker       Worker
 (Scrapes)     (Scrapes)    (Scrapes)
     \              │           /
      ▼             ▼          ▼
   [ Push Update to db_write_buffer List ]
```

### Job Layout
- **Queue Name**: `statsQueue`
- **Job Names**: `leetcode`, `codeforces`, `codechef`, `gfg`, `github`
- **Job Data Payload**:
```json
{
  "studentId": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
  "platform": "leetcode",
  "handle": "adityasingh3012"
}
```

---

## 📨 Custom Event Bus (Redis Pub/Sub)

Once background stats updates are processed and stored by the Database Buffer Writer (`db-writer.ts`), they are published to a Redis Pub/Sub broker channel to notify downstream services.

### Core Architecture (`event-bus.ts`)
- **Publisher**: `redisConnection.publish(channel, data)`
- **Subscriber**: `redisSubscriber.subscribe(channel)`

---

## ⚡ Main Event: `student:stats:updated`

Published whenever a scraping job successfully updates a student's profile.

### Event Payload
```json
{
  "studentId": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
  "platform": "leetcode",
  "status": "COMPLETED",
  "oldStats": {
    "leetcodeSolved": 250,
    "totalSolved": 250,
    "overallScore": 250
  },
  "newStats": {
    "leetcodeSolved": 255,
    "totalSolved": 255,
    "overallScore": 255
  },
  "deltaSolved": 5
}
```

---

## ⚙️ Event Consumers

Multiple internal consumers subscribe to `student:stats:updated` to run side-effects:

### 1. Stats History Logger
- Checks if `deltaSolved > 0`.
- Inserts a record into the `StatsHistory` model to track progress changes.
- Used to construct student progress metrics (e.g. "Solved 10 questions in the last 7 days").

### 2. Badge Unlock Checker
- Checks if the new stats satisfy the unlock requirements for badges (defined in the `Badge` model).
- For example, if a badge requires `leetcodeSolved >= 100` and the update crosses this threshold, it inserts a entry into `StudentBadge`.

### 3. Real-Time Rank Alerting
- Compares the `oldStats.overallScore` and `newStats.overallScore`.
- Triggers rank calculations if scores changed.

---

## 🛡️ Fault Tolerance & Retry Logic

1. **Exponential Backoff**: BullMQ workers are configured with a retry policy (e.g., 3 retries, backoff delay of 5000ms multiplied exponentially). This protects against transient proxy failures and short-lived coding platform API outages.
2. **Scraper Isolation**: If LeetCode is down, GeeksforGeeks and GitHub stats updates are unaffected since they are isolated workers running independent queues.
