import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { statsQueue } from '../queues/stats.queue';
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
        rollNo: student.rollNo,
        branch: student.branch,
        year: student.year,
        section: student.section,
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
      githubHandle
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
    await redisConnection.del('leaderboard_data');

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

    const { password, rollNo, ...updateData } = req.body; // Protect rollNo from updates here

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
    await redisConnection.del('leaderboard_data');

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
        await statsQueue.add(p.name as any, {
          studentId: student.id,
          platform: p.name as any,
          handle: p.handle,
        });
        enqueued++;
      }
    }

    // Invalidate leaderboard cache
    await redisConnection.del('leaderboard_data');

    res.json({ status: 'success', message: `Enqueued ${enqueued} jobs for student ${student.name}` });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
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
      rollNo: student.rollNo,
      branch: student.branch,
      year: student.year,
      section: student.section,
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

    res.json({ status: 'success', data });
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
    for (const student of students) {
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

    // Bust the leaderboard cache so fresh data shows next request
    await redisConnection.del('leaderboard_data');

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
