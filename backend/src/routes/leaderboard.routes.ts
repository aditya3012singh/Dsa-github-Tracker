import { Router } from 'express';
import { getLeaderboard, getRankHistory, exportLeaderboard } from '../controllers/leaderboard.controller';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.use(apiRateLimiter);

router.get('/', optionalAuthenticate, getLeaderboard);
router.get('/export', optionalAuthenticate, exportLeaderboard);
router.get('/rank-history/:studentId', getRankHistory);

export default router;
