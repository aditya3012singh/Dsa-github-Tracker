# ⚡ Caching Strategy & Redis Design

This document details the caching mechanism, Redis key layout, and cache stampede prevention strategy used in the KIET Coding Analytics Platform.

---

## 🏛️ Cache-Aside Pattern

For both student profiles and paginated leaderboard queries, the platform applies the **Cache-Aside Pattern**:

```
Client Request
      │
      ├──► Check Redis Cache
      │         │
      │         ├─── (Hit) ───► Return JSON response to Client
      │         │
      │         └─── (Miss) ──► Query PostgreSQL DB
      │                               │
      │                        Write to Redis (TTL: 300s)
      │                               │
      │                         Return response
```

---

## 🛑 Cache Stampede Prevention (Request Coalescing)

When the leaderboard cache expires under high traffic (e.g. during a coding contest), a "Cache Stampede" can occur where hundreds of requests hit the database simultaneously to rebuild the same cache page.

To prevent this, the platform implements **Request Coalescing (Single-Flight)** in `leaderboard.controller.ts`:

```typescript
// Global map to track active database queries for specific cache keys
const activeLeaderboardQueries = new Map<string, Promise<{ data: any[]; total: number }>>();
```

### Flow Diagram

```
         Multiple Concurrent Requests for Leaderboard Page 1
                 │          │          │          │
                 ▼          ▼          ▼          ▼
           [ Check activeLeaderboardQueries Map for Key ]
             /                                      \
    (If Map has Key)                         (If Map empty for Key)
          |                                            |
   Coalesce & Wait                              Acquire Lock (Add
   on existing Promise                          Promise to Map)
          │                                            │
          │                                      Query DB & Cache
          │                                      in Redis (TTL: 5m)
          │                                            │
          ▼                                            ▼
   Return same result ◄───────────────────────── Resolve Promise &
   from DB Promise                               Remove from Map
```

This ensures that regardless of concurrency, **exactly one SQL query** hits the database on a cache miss.

---

## 🏷️ Versioned Caching

Instead of performing expensive wildcard scans to invalidate cached pages when leaderboard statistics change, the platform uses a **Versioned Cache Key** structure:

```
leaderboard:v3:v{version}:{filters_hash}
```

1. **`version`** is a simple Redis key `leaderboard:version` containing an auto-incrementing integer.
2. **`filters_hash`** is the JSON string representation of all query filters (page, limit, search, year, branch, section, sorting order).
3. **Invalidation Flow**: When a batch of coding stats updates completes, the DB Writer calls `redis.incr('leaderboard:version')`.
4. All future read requests look up keys containing the new version index. The old cache keys are orphaned and automatically cleaned up by Redis when their 300-second TTL expires.

---

## 📊 Redis Key Structures

| Key Pattern | Redis Type | Purpose | TTL |
|:---|:---|:---|:---|
| `leaderboard:version` | `String` | Global cache invalidation version counter. | Infinite |
| `leaderboard:v3:v{version}:{filters}` | `String` | Cached leaderboard pages (paginated & filtered). | 300 seconds |
| `student:profile:{studentId}` | `String` | Cached profile statistics payload. | 300 seconds |
| `online_users` | `Sorted Set (ZSET)` | Tracks active users. Members are `studentId`, score is epoch timestamp. | Infinite (Pruned on read) |
| `fetch_schedule` | `Sorted Set (ZSET)` | Coordinates automatic sync queues. Score is next execution time. | Infinite |
| `db_write_buffer` | `List` | Buffer queue for pending stats writes. | Infinite |
