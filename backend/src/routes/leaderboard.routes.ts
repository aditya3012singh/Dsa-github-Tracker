import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(apiRateLimiter);

router.get('/', getLeaderboard);

export default router;
