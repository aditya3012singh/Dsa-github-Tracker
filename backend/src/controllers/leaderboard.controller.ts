import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { cache } from '../services/cache/RedisCacheService';
import { calculateOverallScore } from '../utils/scoring';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import * as XLSX from 'xlsx';

// Global map to track active database queries for specific cache keys (Single Flight)
const activeLeaderboardQueries = new Map<string, Promise<{ data: any[]; total: number }>>();

const LEADERBOARD_SELECT = {
  id: true,
  name: true,
  rollNo: true,
  libraryId: true,
  branch: true,
  graduationYear: true,
  courseDuration: true,
  section: true,
  linkedIn: true,
  leetcodeHandle: true,
  codeforcesHandle: true,
  gfgHandle: true,
  codechefHandle: true,
  githubHandle: true,
  codingStats: {
    select: {
      totalSolved: true,
      overallScore: true,
      leetcodeSolved: true,
      leetcodeEasy: true,
      leetcodeMedium: true,
      leetcodeHard: true,
      codeforcesRating: true,
      codeforcesMaxRating: true,
      codechefRating: true,
      codechefSolved: true,
      gfgSolved: true,
      githubContributions: true,
      githubRepos: true,
      githubFollowers: true,
      githubFollowing: true,
      updatedAt: true
    }
  }
};

/**
 * Map Prisma student object to Leaderboard format
 */
const mapStudentToLeaderboard = (student: any) => {
  const stats = student.codingStats;
  return {
    id: student.id,
    name: student.name,
    rollNo: student.rollNo,
    libraryId: student.libraryId,
    branch: student.branch,
    graduationYear: student.graduationYear,
    courseDuration: student.courseDuration,
    year: student.courseDuration ? student.courseDuration - (student.graduationYear - 2026) : 0,
    section: student.section,
    linkedIn: student.linkedIn,
    totalSolved: stats?.totalSolved || 0,
    score: stats?.overallScore || 0,
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
    codechef: {
      handle: student.codechefHandle,
      rating: stats?.codechefRating || 0,
      total: stats?.codechefSolved || 0
    },
    gfg: {
      handle: student.gfgHandle,
      total: stats?.gfgSolved || 0
    },
    github: {
      handle: student.githubHandle,
      contributions: stats?.githubContributions || 0,
      repositories: stats?.githubRepos || 0,
      followers: stats?.githubFollowers || 0,
      following: stats?.githubFollowing || 0
    },
    updatedAt: stats?.updatedAt,
    rankChange: student.rankChange || 0
  };
};

export const getLeaderboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const sortBy = (req.query.sortBy as string) || 'totalSolved';
    const order = (req.query.order as string) || 'desc';
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const yearFilter = req.query.year as string;
    const branchFilter = req.query.branch as string;
    const sectionFilter = req.query.section as string;

    const academicYear = 2026;
    
    // 1. Build the Prisma Where Clause for filtering
    const where: any = {
      codingStats: { isNot: null },
      graduationYear: { gte: academicYear } // Filter out Alumni
    };

    if (yearFilter && yearFilter !== 'All') {
      const yearInt = parseInt(yearFilter);
      const btechGradYear = academicYear + (4 - yearInt);
      const mcaGradYear = academicYear + (2 - yearInt);
      
      const yearConditions = [
        { courseDuration: 4, graduationYear: btechGradYear },
        { courseDuration: 2, graduationYear: mcaGradYear }
      ];
      
      // If there's already an OR (unlikely at this stage, but safe practice)
      if (where.OR) {
         where.AND = [ { OR: where.OR }, { OR: yearConditions } ];
         delete where.OR;
      } else {
         where.OR = yearConditions;
      }
    }

    if (branchFilter && branchFilter !== 'All') {
      where.branch = { contains: branchFilter, mode: 'insensitive' };
    }

    if (sectionFilter && sectionFilter !== 'All') {
      where.section = { equals: sectionFilter, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 2. Map SortBy to Prisma OrderBy
    let orderBy: any = {};
    const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'leetcode':
        orderBy = { codingStats: { leetcodeSolved: sortOrder } };
        break;
      case 'codeforces':
        orderBy = { codingStats: { codeforcesRating: sortOrder } };
        break;
      case 'codechef':
        orderBy = { codingStats: { codechefRating: sortOrder } };
        break;
      case 'gfg':
        orderBy = { codingStats: { gfgSolved: sortOrder } };
        break;
      case 'github':
        orderBy = { codingStats: { githubContributions: sortOrder } };
        break;
      case 'github_repos':
        orderBy = { codingStats: { githubRepos: sortOrder } };
        break;
      case 'github_followers':
        orderBy = { codingStats: { githubFollowers: sortOrder } };
        break;
      case 'totalSolved':
        orderBy = { codingStats: { totalSolved: sortOrder } };
        break;
      case 'score':
      default:
        orderBy = { codingStats: { overallScore: sortOrder } };
    }

    // 3. Execute Paginated Query + Count Total (with versioned caching and Single-Flight)
    let leaderboardData: any[] = [];
    let totalCount = 0;
    let source = 'db';

    try {
      // Fetch current cache version
      const version = await cache.get('leaderboard', 'leaderboard:version') || '0';
      const cacheKey = `leaderboard:v3:v${version}:${JSON.stringify({ page, limit, sortBy, order, search, yearFilter, branchFilter, sectionFilter })}`;

      const cached = await cache.get('leaderboard', cacheKey);
      if (cached) {
        ({ data: leaderboardData, total: totalCount } = JSON.parse(cached));
        source = 'redis';
      } else {
        // Cache Miss: Check if another request is already fetching this exact query
        let queryPromise = activeLeaderboardQueries.get(cacheKey);

        if (!queryPromise) {
          console.log(`[DEBUG] Cache miss. Fetching from DB for key: ${cacheKey}`);
          queryPromise = (async () => {
            const [students, count] = await Promise.all([
              prisma.student.findMany({
                where,
                select: LEADERBOARD_SELECT,
                orderBy,
                skip,
                take: limit,// 4. Handle Authenticated User Rank
              }),
              prisma.student.count({ where })
            ]);
            const mappedData = students.map(mapStudentToLeaderboard);

            // Calculate rankChange (Compare current rank with latest RankHistory record)
            const studentIds = students.map(s => s.id);
            const lastSnapshots = await prisma.rankHistory.findMany({
              where: {
                studentId: { in: studentIds },
                createdAt: { lt: new Date(new Date().setHours(0,0,0,0)) }
              },
              orderBy: { createdAt: 'desc' },
              distinct: ['studentId']
            });

            const rankMap = new Map<string, number>(lastSnapshots.map((s: any) => [s.studentId, s.rank]));
            const enrichedData = mappedData.map((s: any, i: number) => ({
              ...s,
              rankChange: rankMap.has(s.id) ? (rankMap.get(s.id) as number - ((page - 1) * limit + i + 1)) : 0
            }));

            // Cache for 5 minutes (300s) to keep it fresh and reduce DB load
            await cache.set('leaderboard', cacheKey, JSON.stringify({ data: enrichedData, total: count }), 300);

            return { data: enrichedData, total: count };
          })();

          activeLeaderboardQueries.set(cacheKey, queryPromise);
        } else {
          console.log(`[DEBUG] Cache stampede prevented! Coalescing request for key: ${cacheKey}`);
          source = 'db_coalesced';
        }

        try {
          const result = await queryPromise;
          leaderboardData = result.data;
          totalCount = result.total;
        } finally {
          activeLeaderboardQueries.delete(cacheKey);
        }
      }
    } catch (err) {
      logger.error('Redis/Leaderboard Cache Error, falling back to DB:', err);
      // Fallback: If Redis fails, query DB directly
      if (leaderboardData.length === 0) {
        const [students, count] = await Promise.all([
          prisma.student.findMany({
            where,
            select: LEADERBOARD_SELECT,
            orderBy,
            skip,
            take: limit,
          }),
          prisma.student.count({ where })
        ]);
        leaderboardData = students.map(mapStudentToLeaderboard);
        totalCount = count;
      }
    }

    // 4. Handle Authenticated User Rank (Dynamic based on current filters & sort)
    let userRankInfo = null;
    if (req.user) {
      try {
        const currentUserStats = await prisma.codingStats.findUnique({
          where: { studentId: req.user.id }
        });

        if (currentUserStats) {
          // Identify the metric field to compare
          let metricField = '';
          let metricValue: any = 0;

          switch (sortBy) {
            case 'leetcode': metricField = 'leetcodeSolved'; break;
            case 'codeforces': metricField = 'codeforcesRating'; break;
            case 'codechef': metricField = 'codechefRating'; break;
            case 'gfg': metricField = 'gfgSolved'; break;
            case 'github': metricField = 'githubContributions'; break;
            case 'totalSolved': metricField = 'totalSolved'; break;
            case 'score':
            default: metricField = 'overallScore';
          }
          
          metricValue = (currentUserStats as any)[metricField] || 0;

          // Count students ahead of current user using the SAME filters
          const countAhead = await prisma.student.count({
            where: {
              ...where,
              codingStats: {
                [metricField]: { gt: metricValue }
              }
            }
          });

          const currentRank = countAhead + 1;

          // Find or fetch user detail
          let userInPage = leaderboardData.find(s => s.id === req.user?.id);
          if (!userInPage) {
            const studentObj = await prisma.student.findUnique({
              where: { id: req.user.id },
              select: LEADERBOARD_SELECT
            });
            if (studentObj) {
              userInPage = mapStudentToLeaderboard(studentObj);
            }
          }

          if (userInPage) {
            userRankInfo = {
              rank: currentRank,
              student: userInPage
            };
          }
        }
      } catch (uErr) {
        logger.error('Error calculating personal rank:', uErr);
      }
    }

    // 5. Respond
    res.json({ 
      status: 'success', 
      page,
      limit,
      sortBy,
      order,
      search,
      total: totalCount,
      userRank: userRankInfo,
      data: leaderboardData, 
      source: source 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get rank history for a specific student
 */
export const getRankHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const history = await prisma.rankHistory.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 30, // Last 30 snapshots
    });

    res.json({
      status: 'success',
      data: history.reverse() // Chronological order for charts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export leaderboard data as Excel sheet
 */
export const exportLeaderboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sortBy = (req.query.sortBy as string) || 'totalSolved';
    const order = (req.query.order as string) || 'desc';
    const search = (req.query.search as string) || '';
    const yearFilter = req.query.year as string;
    const branchFilter = req.query.branch as string;
    const sectionFilter = req.query.section as string;
    const onlineFilter = req.query.online === 'true';

    const academicYear = 2026;
    
    // 1. Build the Prisma Where Clause for filtering
    const where: any = {
      codingStats: { isNot: null },
      graduationYear: { gte: academicYear } // Filter out Alumni
    };

    if (yearFilter && yearFilter !== 'All') {
      const yearInt = parseInt(yearFilter);
      const btechGradYear = academicYear + (4 - yearInt);
      const mcaGradYear = academicYear + (2 - yearInt);
      
      const yearConditions = [
        { courseDuration: 4, graduationYear: btechGradYear },
        { courseDuration: 2, graduationYear: mcaGradYear }
      ];
      
      if (where.OR) {
         where.AND = [ { OR: where.OR }, { OR: yearConditions } ];
         delete where.OR;
      } else {
         where.OR = yearConditions;
      }
    }

    if (branchFilter && branchFilter !== 'All') {
      where.branch = { contains: branchFilter, mode: 'insensitive' };
    }

    if (sectionFilter && sectionFilter !== 'All') {
      where.section = { equals: sectionFilter, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (onlineFilter) {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      try {
        await redisConnection.zremrangebyscore('online_users', '-inf', twoMinutesAgo);
        const onlineIds = await redisConnection.zrevrange('online_users', 0, -1);
        where.id = { in: onlineIds };
      } catch (cacheErr) {
        logger.error('[Export Online Filter] Failed to resolve online users from cache:', cacheErr);
      }
    }

    // 2. Map SortBy to Prisma OrderBy
    let orderBy: any = {};
    const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'leetcode':
        orderBy = { codingStats: { leetcodeSolved: sortOrder } };
        break;
      case 'codeforces':
        orderBy = { codingStats: { codeforcesRating: sortOrder } };
        break;
      case 'codechef':
        orderBy = { codingStats: { codechefRating: sortOrder } };
        break;
      case 'gfg':
        orderBy = { codingStats: { gfgSolved: sortOrder } };
        break;
      case 'github':
        orderBy = { codingStats: { githubContributions: sortOrder } };
        break;
      case 'github_repos':
        orderBy = { codingStats: { githubRepos: sortOrder } };
        break;
      case 'github_followers':
        orderBy = { codingStats: { githubFollowers: sortOrder } };
        break;
      case 'totalSolved':
        orderBy = { codingStats: { totalSolved: sortOrder } };
        break;
      case 'score':
      default:
        orderBy = { codingStats: { overallScore: sortOrder } };
    }

    // 3. Fetch all matching records without pagination
    const students = await prisma.student.findMany({
      where,
      select: LEADERBOARD_SELECT,
      orderBy,
    });

    const mappedData = students.map(mapStudentToLeaderboard);

    // 4. Build Excel Worksheet structure
    const worksheetData = mappedData.map((s: any, index: number) => ({
      'Rank': index + 1,
      'Name': s.name,
      'Library ID': s.libraryId,
      'Roll No': s.rollNo || '',
      'Batch/Graduation': s.graduationYear || '',
      'Current Year': s.year || '',
      'Branch': s.branch || '',
      'Section': s.section || '',
      'Total Solved': s.totalSolved || 0,
      'LeetCode Solved': s.leetcode.total || 0,
      'LeetCode Easy': s.leetcode.easy || 0,
      'LeetCode Medium': s.leetcode.medium || 0,
      'LeetCode Hard': s.leetcode.hard || 0,
      'LeetCode Handle': s.leetcode.handle || '',
      'Codeforces Rating': s.codeforces.rating || 0,
      'Codeforces Max Rating': s.codeforces.maxRating || 0,
      'Codeforces Handle': s.codeforces.handle || '',
      'GFG Solved': s.gfg.total || 0,
      'GFG Handle': s.gfg.handle || '',
      'GitHub Contributions': s.github.contributions || 0,
      'GitHub Repositories': s.github.repositories || 0,
      'GitHub Followers': s.github.followers || 0,
      'GitHub Following': s.github.following || 0,
      'GitHub Handle': s.github.handle || '',
      'LinkedIn Profile': s.linkedIn || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard');

    // 5. Stream Excel File Buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leaderboard.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
