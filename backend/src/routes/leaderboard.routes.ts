import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.use(apiRateLimiter);

router.get('/', optionalAuthenticate, getLeaderboard);

export default router;
