# 🔌 API Endpoint Reference

This document catalogs the REST API endpoints available in the KIET Coding Analytics Platform. All request/response bodies are formatted as JSON.

---

## 🔒 Authentication API

### Register a Student
* **Method**: `POST`
* **Path**: `/api/auth/register`
* **Request Body**:
```json
{
  "name": "Aditya Singh",
  "libraryId": "2428CSEAI1029",
  "email": "aditya@example.com",
  "password": "password123",
  "branch": "Computer Science and Engineering (AI)",
  "year": "2",
  "leetcodeHandle": "adityasingh3012",
  "githubHandle": "aditya3012singh",
  "gfgHandle": "gfg_id",
  "codeforcesHandle": "cf_id",
  "codechefHandle": "cc_id",
  "linkedIn": "https://www.linkedin.com/in/aditya-singh-8b8045345/"
}
```
* **Response (201 Created)**:
```json
{
  "status": "success",
  "message": "Student registered successfully",
  "data": {
    "id": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
    "name": "Aditya Singh",
    "libraryId": "2428CSEAI1029"
  }
}
```

### Log In
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Request Body**:
```json
{
  "libraryId": "2428CSEAI1029",
  "password": "password123"
}
```
* **Response (200 OK)**:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
    "name": "Aditya Singh",
    "libraryId": "2428CSEAI1029"
  }
}
```

---

## 👨‍💻 Student API

### Get Student Profile
* **Method**: `GET`
* **Path**: `/api/students/:id`
* **Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "id": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
    "name": "Aditya Singh",
    "libraryId": "2428CSEAI1029",
    "rollNo": null,
    "email": "aditya@example.com",
    "branch": "Computer Science and Engineering (AI)",
    "year": 2,
    "section": "A",
    "linkedIn": "https://www.linkedin.com/in/aditya-singh-8b8045345/",
    "leetcode": {
      "handle": "adityasingh3012",
      "total": 255,
      "easy": 144,
      "medium": 106,
      "hard": 5
    },
    "codeforces": {
      "handle": "cf_id",
      "rating": 1500,
      "maxRating": 1500
    },
    "gfg": {
      "handle": "gfg_id",
      "total": 100
    },
    "codechef": {
      "handle": "cc_id",
      "rating": 1600,
      "total": 50
    },
    "github": {
      "handle": "aditya3012singh",
      "contributions": 1111,
      "repositories": 38,
      "followers": 3,
      "following": 7
    },
    "totalSolved": 405,
    "score": 405,
    "updatedAt": "2026-06-27T18:00:48.000Z"
  },
  "source": "redis"
}
```

### Update Profile
* **Method**: `PUT`
* **Path**: `/api/students/profile`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "name": "Aditya Singh",
  "rollNo": "2100290120123",
  "branch": "Computer Science and Engineering (AI)",
  "year": 2,
  "section": "A",
  "leetcodeHandle": "adityasingh3012",
  "githubHandle": "aditya3012singh",
  "linkedIn": "https://www.linkedin.com/in/aditya-singh-8b8045345/"
}
```

### Trigger Scraping Stats (Manual Refresh)
* **Method**: `POST`
* **Path**: `/api/students/:id/fetch`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Enqueued 5 jobs for student Aditya Singh"
}
```

### Sync All Profiles (Admin)
* **Method**: `POST`
* **Path**: `/api/students/sync-all`
* **Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Enqueued 450 jobs for 90 students",
  "studentsQueued": 90,
  "jobsEnqueued": 450
}
```

### Get Online Students
* **Method**: `GET`
* **Path**: `/api/students/online`
* **Response (200 OK)**:
```json
{
  "status": "success",
  "data": [ ... ]
}
```

---

## 📊 Leaderboard API

### Fetch Leaderboard
* **Method**: `GET`
* **Path**: `/api/leaderboard`
* **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `limit`: Items per page (default: `100`)
  - `sortBy`: Metric to sort by (`totalSolved`, `score`, `leetcode`, `codeforces`, `gfg`, `github`)
  - `order`: Sort direction (`asc`, `desc`)
  - `search`: Search query string (filters by name / roll number)
  - `year`: Filter by student year
  - `branch`: Filter by student branch
  - `section`: Filter by student section
* **Response (200 OK)**:
```json
{
  "status": "success",
  "page": 1,
  "limit": 100,
  "sortBy": "totalSolved",
  "order": "desc",
  "total": 3120,
  "data": [
    {
      "id": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
      "name": "Aditya Singh",
      "rollNo": null,
      "libraryId": "2428CSEAI1029",
      "branch": "Computer Science and Engineering (AI)",
      "year": 2,
      "section": "A",
      "totalSolved": 405,
      "score": 405,
      "leetcode": { "handle": "adityasingh3012", "total": 255 },
      "github": { "handle": "aditya3012singh", "contributions": 1111 },
      "linkedIn": "https://www.linkedin.com/in/aditya-singh-8b8045345/",
      "rankChange": 3
    }
  ]
}
```

### Get Rank History
* **Method**: `GET`
* **Path**: `/api/leaderboard/rank-history/:studentId`
* **Response (200 OK)**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "history-uuid",
      "studentId": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
      "rank": 678,
      "score": 250,
      "createdAt": "2026-06-26T00:00:00.000Z"
    },
    {
      "id": "history-uuid-2",
      "studentId": "f463dd4d-a0f9-4c32-99cc-eebfbc170e4d",
      "rank": 675,
      "score": 255,
      "createdAt": "2026-06-27T00:00:00.000Z"
    }
  ]
}
```
