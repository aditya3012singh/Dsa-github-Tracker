import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { cache } from '../services/cache/RedisCacheService';
import { statsQueue, userSyncQueue } from '../queues/stats.queue';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { calculateOverallScore } from '../utils/scoring';
import { sanitizeHandle } from '../utils/sanitizer';

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        codingStats: true
      }
    });

    const data = students.map((student: any) => {
      const stats = student.codingStats;
      return {
        id: student.id,
        name: student.name,
        libraryId: student.libraryId,
        rollNo: student.rollNo,
        email: student.email,
        branch: student.branch,
        year: student.year,
        section: student.section,
        linkedIn: student.linkedIn,
        leetcode: {
          handle: student.leetcodeHandle,
          total: stats?.leetcodeSolved || 0,
          easy: stats?.leetcodeEasy || 0,
          medium: stats?.leetcodeMedium || 0,
          hard: stats?.leetcodeHard || 0
        },
        codeforces: {
          handle: student.codeforcesHandle,
          rating: stats?.codeforcesRating || 0,
          maxRating: stats?.codeforcesMaxRating || 0
        },
        gfg: {
          handle: student.gfgHandle,
          total: stats?.gfgSolved || 0
        },
        codechef: {
          handle: student.codechefHandle,
          rating: stats?.codechefRating || 0,
          total: stats?.codechefSolved || 0
        },
        github: {
          handle: student.githubHandle,
          contributions: stats?.githubContributions || 0,
          repositories: stats?.githubRepos || 0,
          followers: stats?.githubFollowers || 0,
          following: stats?.githubFollowing || 0
        },
        totalSolved: (stats?.leetcodeSolved || 0) + (stats?.gfgSolved || 0) + (stats?.codechefSolved || 0),
        score: calculateOverallScore(stats),
        updatedAt: stats?.updatedAt
      };
    });

    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      rollNo, // Keep rollNo for creation if it's still a field in the DB
      libraryId, // Add libraryId for creation
      branch,
      year,
      leetcodeHandle,
      codeforcesHandle,
      gfgHandle,
      codechefHandle,
      githubHandle,
      linkedIn
    } = req.body;

    const student = await prisma.student.create({
      data: {
        name,
        rollNo,
        libraryId, // Assign libraryId
        branch,
        year,
        leetcodeHandle: sanitizeHandle(leetcodeHandle, 'leetcode'),
        codeforcesHandle: sanitizeHandle(codeforcesHandle, 'codeforces'),
        gfgHandle: sanitizeHandle(gfgHandle, 'gfg'),
        codechefHandle: sanitizeHandle(codechefHandle, 'codechef'),
        githubHandle: sanitizeHandle(githubHandle, 'github'),
        linkedIn: linkedIn || null,
        password: 'temporary_password' // Should be handled by registration
      } as any
    });
    res.status(201).json({ status: 'success', data: student });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Safety: only allow updating own profile via this specific ID route
    if (req.user?.id !== id) {
      return res.status(403).json({ status: 'error', message: 'You can only update your own profile' });
    }

    const { password, ...updateData } = req.body;

    // Sanitize any handles present in the update
    const sanitizedData = { ...updateData };
    if (sanitizedData.leetcodeHandle) sanitizedData.leetcodeHandle = sanitizeHandle(sanitizedData.leetcodeHandle, 'leetcode');
    if (sanitizedData.codeforcesHandle) sanitizedData.codeforcesHandle = sanitizeHandle(sanitizedData.codeforcesHandle, 'codeforces');
    if (sanitizedData.gfgHandle) sanitizedData.gfgHandle = sanitizeHandle(sanitizedData.gfgHandle, 'gfg');
    if (sanitizedData.codechefHandle) sanitizedData.codechefHandle = sanitizeHandle(sanitizedData.codechefHandle, 'codechef');
    if (sanitizedData.githubHandle) sanitizedData.githubHandle = sanitizeHandle(sanitizedData.githubHandle, 'github');

    const student = await prisma.student.update({
      where: { id },
      data: sanitizedData
    });

    // Invalidate cache
    await redisConnection.incr('leaderboard:version');
    await cache.del('student', `student:profile:${student.id}`);

    res.json({ status: 'success', data: { id: student.id, name: student.name, section: student.section } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/profile
 * Update CURRENT authenticated student's profile
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const { password, libraryId: _libId, ...updateData } = req.body; // Protect libraryId from being overwritten

    // Sanitize handles
    const sanitizedData = { ...updateData };
    if (sanitizedData.leetcodeHandle) sanitizedData.leetcodeHandle = sanitizeHandle(sanitizedData.leetcodeHandle, 'leetcode');
    if (sanitizedData.codeforcesHandle) sanitizedData.codeforcesHandle = sanitizeHandle(sanitizedData.codeforcesHandle, 'codeforces');
    if (sanitizedData.gfgHandle) sanitizedData.gfgHandle = sanitizeHandle(sanitizedData.gfgHandle, 'gfg');
    if (sanitizedData.codechefHandle) sanitizedData.codechefHandle = sanitizeHandle(sanitizedData.codechefHandle, 'codechef');
    if (sanitizedData.githubHandle) sanitizedData.githubHandle = sanitizeHandle(sanitizedData.githubHandle, 'github');

    const student = await prisma.student.update({
      where: { id },
      data: sanitizedData
    });

    // Invalidate leaderboard cache
    await redisConnection.incr('leaderboard:version');
    await cache.del('student', `student:profile:${student.id}`);

    res.json({ status: 'success', data: student });
  } catch (error) {
    next(error);
  }
};

export const triggerFetch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user?.id !== id) {
      return res.status(403).json({ status: 'error', message: 'You can only trigger fetch for your own account' });
    }

    const student = await prisma.student.findUnique({ where: { id } });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const platforms = [
      { name: 'leetcode', handle: student.leetcodeHandle },
      { name: 'codeforces', handle: student.codeforcesHandle },
      { name: 'codechef', handle: student.codechefHandle },
      { name: 'gfg', handle: student.gfgHandle },
      { name: 'github', handle: student.githubHandle }
    ] as const;

    let enqueued = 0;
    for (const p of platforms) {
      if (p.handle) {
        await userSyncQueue.add(p.name as any, {
          studentId: student.id,
          platform: p.name as any,
          handle: p.handle,
        });
        enqueued++;
      }
    }

    // Push the student's next schedule forward in Redis by 11 hours
    try {
      await redisConnection.zadd('fetch_schedule', Date.now() + 11 * 60 * 60 * 1000, student.id);
    } catch (err) {
      logger.error(`[Redis Schedule] Failed to push schedule for student ${student.id}:`, err);
    }

    // Invalidate leaderboard cache
    await redisConnection.incr('leaderboard:version');

    res.json({ status: 'success', message: `Enqueued ${enqueued} jobs for student ${student.name}` });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cacheKey = `student:profile:${id}`;

    // Try Redis cache first
    try {
      const cached = await cache.get('student', cacheKey);
      if (cached) {
        return res.json({ status: 'success', data: JSON.parse(cached), source: 'redis' });
      }
    } catch (cacheErr) {
      logger.error('Redis Profile Cache Read Error:', cacheErr);
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: { codingStats: true }
    });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const stats = (student as any).codingStats;
    const data = {
      id: student.id,
      name: student.name,
      libraryId: student.libraryId,
      rollNo: student.rollNo,
      email: student.email,
      branch: student.branch,
      year: student.year,
      section: student.section,
      linkedIn: student.linkedIn,
      leetcode: {
        handle: student.leetcodeHandle,
        total: stats?.leetcodeSolved || 0,
        easy: stats?.leetcodeEasy || 0,
        medium: stats?.leetcodeMedium || 0,
        hard: stats?.leetcodeHard || 0
      },
      codeforces: {
        handle: student.codeforcesHandle,
        rating: stats?.codeforcesRating || 0,
        maxRating: stats?.codeforcesMaxRating || 0
      },
      gfg: {
        handle: student.gfgHandle,
        total: stats?.gfgSolved || 0
      },
      codechef: {
        handle: student.codechefHandle,
        rating: stats?.codechefRating || 0,
        total: stats?.codechefSolved || 0
      },
      github: {
        handle: student.githubHandle,
        contributions: stats?.githubContributions || 0,
        repositories: stats?.githubRepos || 0,
        followers: stats?.githubFollowers || 0,
        following: stats?.githubFollowing || 0
      },
      totalSolved: (stats?.leetcodeSolved || 0) + (stats?.gfgSolved || 0) + (stats?.codechefSolved || 0),
      score: calculateOverallScore(stats),
      updatedAt: stats?.updatedAt
    };

    // Cache in Redis for 5 minutes (300 seconds)
    try {
      await cache.set('student', cacheKey, JSON.stringify(data), 300);
    } catch (cacheErr) {
      logger.error('Redis Profile Cache Write Error:', cacheErr);
    }

    res.json({ status: 'success', data, source: 'db' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/sync-all
 * Immediately enqueue fetch jobs for every student that has no stats or
 * stats older than 1 hour. No auth required so it can be triggered from
 * the UI or a simple curl without a token.
 */
export const syncAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const platforms = [
      { name: 'leetcode',    field: 'leetcodeHandle'   },
      { name: 'codeforces', field: 'codeforcesHandle'  },
      { name: 'codechef',   field: 'codechefHandle'    },
      { name: 'gfg',        field: 'gfgHandle'         },
      { name: 'github',     field: 'githubHandle'      },
    ] as const;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { codingStats: { is: null } },
          { codingStats: { updatedAt: { lte: oneHourAgo } } },
        ],
      },
    });

    let enqueued = 0;
    const nextSchedule = Date.now() + 11 * 60 * 60 * 1000;
    const pipeline = redisConnection.pipeline();

    for (const student of students) {
      pipeline.zadd('fetch_schedule', nextSchedule, student.id);

      for (const p of platforms) {
        const handle = (student as any)[p.field] as string | null;
        if (handle) {
          await statsQueue.add(p.name as any, {
            studentId: student.id,
            platform: p.name as any,
            handle,
          }, {
            jobId: `sync-all-${student.id}-${p.name}-${Date.now()}`,
          } as any);
          enqueued++;
        }
      }
    }

    try {
      await pipeline.exec();
    } catch (err) {
      logger.error('[Redis Schedule] Failed to update schedules during syncAll:', err);
    }

    // Bust the leaderboard cache so fresh data shows next request
    await redisConnection.incr('leaderboard:version');

    logger.info(`[sync-all] Enqueued ${enqueued} jobs for ${students.length} students`);
    res.json({
      status: 'success',
      message: `Enqueued ${enqueued} jobs for ${students.length} students`,
      studentsQueued: students.length,
      jobsEnqueued: enqueued,
    });
  } catch (error) {
    next(error);
  }
};

export const getOnlineStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    // Prune stale online users
    try {
      await redisConnection.zremrangebyscore('online_users', '-inf', twoMinutesAgo);
    } catch (cacheErr) {
      logger.error('[Online Users] Failed to prune online users:', cacheErr);
    }

    // Get active user IDs
    let onlineIds: string[] = [];
    try {
      onlineIds = await redisConnection.zrevrange('online_users', 0, -1);
    } catch (cacheErr) {
      logger.error('[Online Users] Failed to fetch active user IDs:', cacheErr);
    }

    if (onlineIds.length === 0) {
      return res.json({ status: 'success', data: [] });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: onlineIds } },
      include: { codingStats: true }
    });

    const data = students.map((student: any) => {
      const stats = student.codingStats;
      return {
        id: student.id,
        name: student.name,
        libraryId: student.libraryId,
        rollNo: student.rollNo,
        email: student.email,
        branch: student.branch,
        year: student.year,
        section: student.section,
        linkedIn: student.linkedIn,
        leetcode: {
          handle: student.leetcodeHandle,
          total: stats?.leetcodeSolved || 0,
          easy: stats?.leetcodeEasy || 0,
          medium: stats?.leetcodeMedium || 0,
          hard: stats?.leetcodeHard || 0
        },
        codeforces: {
          handle: student.codeforcesHandle,
          rating: stats?.codeforcesRating || 0,
          maxRating: stats?.codeforcesMaxRating || 0
        },
        gfg: {
          handle: student.gfgHandle,
          total: stats?.gfgSolved || 0
        },
        codechef: {
          handle: student.codechefHandle,
          rating: stats?.codechefRating || 0,
          total: stats?.codechefSolved || 0
        },
        github: {
          handle: student.githubHandle,
          contributions: stats?.githubContributions || 0,
          repositories: stats?.githubRepos || 0,
          followers: stats?.githubFollowers || 0,
          following: stats?.githubFollowing || 0
        },
        totalSolved: (stats?.leetcodeSolved || 0) + (stats?.gfgSolved || 0) + (stats?.codechefSolved || 0),
        score: calculateOverallScore(stats),
        updatedAt: stats?.updatedAt
      };
    });

    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};
