import { Router, Request, Response, NextFunction } from 'express';
import { bulkRegisterStudents } from '../controllers/admin.controller';
import { logger } from '../utils/logger';

const router = Router();

// Middleware to verify administrative access key
const verifyAdminKey = (req: Request, res: Response, next: NextFunction) => {
  const adminKey = process.env.ADMIN_API_KEY || 'admin123';
  const requestKey = req.headers['x-admin-key'];

  if (!requestKey || requestKey !== adminKey) {
    logger.warn(`Unauthorized administrative access attempt to ${req.originalUrl} from IP ${req.ip}`);
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: Invalid or missing administrative access key'
    });
  }

  next();
};

// Route for bulk student insertion (supports single objects or arrays of students)
router.post('/students', verifyAdminKey, bulkRegisterStudents);

export default router;
