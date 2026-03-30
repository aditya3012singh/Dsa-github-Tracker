import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { calculateOverallScore } from '../utils/scoring';
import { AuthRequest } from '../middleware/auth';

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
    year: student.year,
    section: student.section,
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
    updatedAt: stats?.updatedAt
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

    // 1. Build the Prisma Where Clause for filtering
    const where: any = {};

    if (yearFilter && yearFilter !== 'All') {
      where.year = parseInt(yearFilter);
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

    // 3. Execute Paginated Query + Count Total
    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { codingStats: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.student.count({ where })
    ]);

    const leaderboardData = students.map(mapStudentToLeaderboard);

    // 4. Handle Authenticated User Rank (Efficient calculation)
    let userRankInfo = null;
    if (req.user) {
      const userStats = await prisma.codingStats.findUnique({
        where: { studentId: req.user.id }
      });

      if (userStats) {
        // Correct rank calculation based on overallScore
        const rank = await prisma.codingStats.count({
          where: {
            overallScore: { gt: userStats.overallScore }
          }
        });

        // Try to find user in the current page results first
        let userInPage = leaderboardData.find(s => s.id === req.user?.id);
        
        // If not in page, fetch the student object for the userRank response
        if (!userInPage) {
          const studentObj = await prisma.student.findUnique({
            where: { id: req.user.id },
            include: { codingStats: true }
          });
          if (studentObj) {
            userInPage = mapStudentToLeaderboard(studentObj);
          }
        }

        userRankInfo = {
          rank: rank + 1,
          student: userInPage
        };
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
      source: 'db' 
    });
  } catch (error) {
    next(error);
  }
};
