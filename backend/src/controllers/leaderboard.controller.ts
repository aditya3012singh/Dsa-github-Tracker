import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { calculateOverallScore } from '../utils/scoring';
import { AuthRequest } from '../middleware/auth';

export const getLeaderboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const sortBy = (req.query.sortBy as string) || 'totalSolved';
    const order = (req.query.order as string) || 'desc';
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    let leaderboard: any[] = [];
    const cacheKey = 'leaderboard_data';
    
    // Try to get from cache first
    const cachedLeaderboard = await redisConnection.get(cacheKey);
    if (cachedLeaderboard) {
      leaderboard = JSON.parse(cachedLeaderboard);
    } else {
      const students = await prisma.student.findMany({
        include: {
          codingStats: true
        }
      });

      leaderboard = students.map((student: any) => {
        const stats = student.codingStats;
        
        const totalSolved = (stats?.leetcodeSolved || 0) + (stats?.gfgSolved || 0) + (stats?.codechefSolved || 0);
        const score = calculateOverallScore(stats);

        return {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          libraryId: student.libraryId,
          branch: student.branch,
          year: student.year,
          section: student.section,
          totalSolved,
          score,
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
      });

      // Default sorted list for caching
      leaderboard.sort((a: any, b: any) => b.score - a.score);

      // Cache the processed data for 1 hour
      await redisConnection.setex(cacheKey, 3600, JSON.stringify(leaderboard));
    }

    // Apply Search Filter
    if (search) {
      const searchLower = search.toLowerCase();
      leaderboard = leaderboard.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        item.rollNo.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting on the processed list
    leaderboard.sort((a: any, b: any) => {
      let valA: number;
      let valB: number;

      switch (sortBy) {
        case 'leetcode':
          valA = a.leetcode.total;
          valB = b.leetcode.total;
          break;
        case 'codeforces':
          valA = a.codeforces.rating;
          valB = b.codeforces.rating;
          break;
        case 'codechef':
          valA = a.codechef.rating;
          valB = b.codechef.rating;
          break;
        case 'gfg':
          valA = a.gfg.total;
          valB = b.gfg.total;
          break;
        case 'github':
          valA = a.github.contributions;
          valB = b.github.contributions;
          break;
        case 'github_repos':
          valA = a.github.repositories;
          valB = b.github.repositories;
          break;
        case 'github_followers':
          valA = a.github.followers;
          valB = b.github.followers;
          break;
        case 'totalSolved':
          valA = a.totalSolved;
          valB = b.totalSolved;
          break;
        case 'score':
        default:
          valA = a.score;
          valB = b.score;
      }

      return order === 'desc' ? valB - valA : valA - valB;
    });

    // Find requesting user rank in the FULL sorted list
    let userRankInfo = null;
    if (req.user) {
      const index = leaderboard.findIndex(s => s.id === req.user?.id);
      if (index !== -1) {
        userRankInfo = {
          rank: index + 1,
          student: leaderboard[index]
        };
      }
    }

    const paginatedData = leaderboard.slice(skip, skip + limit);

    res.json({ 
      status: 'success', 
      page,
      limit,
      sortBy,
      order,
      search,
      total: leaderboard.length,
      userRank: userRankInfo,
      data: paginatedData, 
      source: cachedLeaderboard ? 'cache' : 'db' 
    });
  } catch (error) {
    next(error);
  }
};
