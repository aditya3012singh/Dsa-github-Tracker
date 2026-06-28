# 📈 Scaling to 100K+ and 1M+ Active Users

This document outlines the architectural roadmap and infrastructure requirements to scale the KIET Coding Analytics Platform from 3,000 students to hundreds of thousands or millions of active users.

---

## 🚀 Scaling to 100,000 Users

At this tier, single-instance database and single-node cache bottlenecks start to appear. The plan focuses on load separation:

### 1. Database Connection Pooling
- PostgreSQL connections are expensive. We would integrate **PgBouncer** or use **Neon's built-in transaction-level pooling** to queue and reuse database connections across scaling instances.
- Prisma configurations should use optimized pool sizes (`?connection_limit=20`).

### 2. Read Replicas
- 90% of traffic on a leaderboard app is read-only (viewing rankings, looking at profiles).
- We would implement **Read-Write Splitting**:
  - **Write Master Database**: For registrations, profile updates, and stats sync.
  - **Read Replicas**: Multiple read-only replicas serving paginated `getLeaderboard` and `getStudentById` queries.

### 3. Isolated Auto-Scaling Worker Pods
- Extract the scraper queue workers out of the main API server process.
- Run workers as separate Docker containers managed by Kubernetes.
- Use **KEDA (Kubernetes Event-driven Autoscaling)** to scale worker pods dynamically based on the queue depth of the BullMQ `statsQueue`.

---

## 🌋 Scaling to 1,000,000+ Users

At a million users, event-driven pipelines and cache management need to be fully distributed.

### 1. Kafka Migration
- Redis Pub/Sub is fire-and-forget; if the subscriber is restarting, the event is lost.
- We would replace the Redis Pub/Sub event bus with **Apache Kafka**:
  - **Topic partitioning** by `studentId` ensures strict ordering of updates for any single student.
  - **Consumer Groups** allow multiple instances of the Stats History Loggers and Badge unlock workers to run in parallel without double-processing events.

```
       DB Writer
           │
     Publishes to
           ▼
     [ Kafka Topics ]
     (Partitioned by studentId)
      /    │    \
     ▼     ▼     ▼
  Consumer Group Instances
 (Loggers, Badges, Notifications)
```

### 2. Partitioned Caching (Redis Cluster)
- A single Redis node can hit network bandwith and memory ceilings.
- We would migrate to a **Redis Cluster**:
  - User profiles (`student:profile:{id}`) will be sharded across multiple nodes using Redis hash slots.
  - Session data and online user statuses are isolated to dedicated cache nodes.

### 3. Database Table Partitioning
- The `StatsHistory` and `RankHistory` tables grow linearly every day. With 1M users, they will easily accumulate hundreds of millions of rows.
- We would configure **PostgreSQL Table Partitioning**:
  - Partition the history tables by range (e.g., monthly partitions).
  - Queries for charts only scan the partition matching the requested timeframe, bypassing the rest of the database index.
- Archive or purge history records older than 90 days.
