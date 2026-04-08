import { Router } from 'express';
import { getLeaderboard, getRankHistory } from '../controllers/leaderboard.controller';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.use(apiRateLimiter);

router.get('/', optionalAuthenticate, getLeaderboard);
router.get('/rank-history/:studentId', getRankHistory);

export default router;
