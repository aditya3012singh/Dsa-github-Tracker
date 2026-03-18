# Department Coding Analytics Platform

A scalable backend platform to track coding statistics of up to 10,000+ students across 7 different competitive programming platforms.

## Platforms Supported
- LeetCode
- Codeforces
- GeeksforGeeks
- CodeChef
- HackerRank
- HackerEarth
- AtCoder

## Architecture Diagram

```
React Dashboard (external)
       │
       ▼
Express API Server
       │
   PostgreSQL
       │
 Redis (BullMQ)
       │
  Worker Cluster
       │
 Platform Fetchers
```

## Features

- **Asynchronous Workers:** All requests to external platforms are pushed to a Redis queue and processed by background workers to prevent blocking the API.
- **Rate Limiting:** Both incoming requests and outgoing scrapes are rate-limited to avoid IP bans.
- **Cron Jobs:** Periodically enqueues jobs for stale student records.
- **Leaderboard Calculation:** Combines metrics from all platforms into a unified score.

## Setup and Installation

### Prerequisites
- Docker
- Docker Compose

### Getting Started

1. Clone the repository and navigate to the `backend` directory.
2. Initialize environment variables:
   ```bash
   cp .env.example .env
   ```
3. Run the complete stack via Docker Compose:
   ```bash
   docker-compose up --build
   ```

This will automatically start:
- Express API server (port 3000)
- BullMQ Worker process
- PostgreSQL database
- Redis container

### API Endpoints

#### `GET /api/students`
Returns the list of tracked students with their current platform statistics.

#### `POST /api/students`
Adds a new student to be tracked.
**Payload:**
```json
{
  "name": "Jane Doe",
  "rollNo": "1001",
  "branch": "CS",
  "year": 3,
  "leetcodeHandle": "janecoder",
  "codeforcesHandle": "janecf"
}
```

#### `GET /api/leaderboard`
Returns the aggregated leaderboard. The results are cached for 5 minutes in Redis.
