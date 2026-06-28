# 💾 Database Schema & Indexing Strategy

This document details the PostgreSQL relational schema, database tables, relationship constraints, and index optimizations applied in the KIET Coding Analytics Platform.

---

## 🗺️ Entity Relationship (ER) Summary

The database is defined using Prisma ORM. Below is a structural mapping of relations:

```
                  +-------------------+
                  |      Student      |
                  +---------+---------+
                            |
         +------------------+------------------+
         | 1:1              | 1:N              | 1:N
         ▼                  ▼                  ▼
+--------+---------+  +-----+--------+  +------+------+
|   CodingStats    |  |  StudentBadge|  |     Goal    |
+------------------+  +-----+--------+  +-------------+
                            | 1:N
                            ▼
                      +-----+--------+
                      |     Badge    |
                      +--------------+

                  +-------------------+
                  |     Student       |
                  +---------+---------+
                            |
         +------------------+------------------+
         | 1:N              | 1:N              | 1:N
         ▼                  ▼                  ▼
+--------+---------+  +-----+--------+  +------+------+
|     FetchJob     |  | RankHistory  |  | StatsHistory|
+------------------+  +--------------+  +-------------+
```

---

## 📋 Database Tables

### 1. `Student`
Stores credentials, handles, and metadata for academic filtering.
* **Key Fields**:
  - `id` (UUID, Primary Key)
  - `libraryId` (String, Unique) - The student's login credential.
  - `email` (String, Unique)
  - `linkedIn` (String) - LinkedIn Profile URL.
  - Platform handles: `leetcodeHandle`, `codeforcesHandle`, `gfgHandle`, `codechefHandle`, `githubHandle`.

### 2. `CodingStats`
Stores aggregates of parsed platform data.
* **Key Fields**:
  - `studentId` (Foreign Key -> `Student.id`, Unique)
  - Solve counts & ratings: `leetcodeSolved`, `codeforcesRating`, `codechefRating`, `gfgSolved`, `githubContributions`, etc.
  - `overallScore` (Float) - Computed global score.
  - `totalSolved` (Int) - LeetCode + CodeChef + GfG solved count.

### 3. `FetchJob`
Tracks the current status of background scraping tasks.
* **Key Fields**:
  - `studentId`, `platform` (Composite Unique Key)
  - `status` (String: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)
  - `lastRun` (DateTime)

### 4. `RankHistory` & `StatsHistory`
Logs time-series historical data.
* **Key Fields** (`RankHistory`): `studentId`, `rank`, `score`, `createdAt`.
* **Key Fields** (`StatsHistory`): `studentId`, `platform`, `solvedDelta`, `createdAt`.

---

## ⚡ Indexing & Optimization Strategy

With over 3,000 students and daily snapshots, index optimization is critical to prevent CPU bottlenecks on PostgreSQL:

### 1. Filtering Optimizations
On the `Student` table, query filters are applied frequently (sorting by year, branch, and section).
```prisma
@@index([year])
@@index([branch])
@@index([section])
```
* **Impact**: Filters like `WHERE year = 2 AND branch = 'CSE'` execute in O(log N) index scans rather than performing a full table scan.

### 2. Sorting Optimizations
The leaderboard queries sort the entire student body by various stats fields. Sorting without an index requires temporary database swap files.
```prisma
@@index([overallScore(sort: Desc)])
@@index([totalSolved(sort: Desc)])
@@index([leetcodeSolved(sort: Desc)])
@@index([codeforcesRating(sort: Desc)])
@@index([gfgSolved(sort: Desc)])
```
* **Impact**: Pre-orders records on write. Paginated queries with offset fetch top records instantly.

### 3. Relationship / JOIN Optimizations
Join queries and chart displays scan history indexes.
```prisma
// On RankHistory:
@@index([studentId])
@@index([createdAt])

// On StatsHistory:
@@index([studentId])
@@index([createdAt])
```
* **Impact**: Rendering the 30-day "Rank Evolution Chart" on profiles requires gathering rows for a specific `studentId` ordered by `createdAt`. These multi-column index paths return chart datasets instantly.
