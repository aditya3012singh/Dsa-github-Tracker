import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    rollNo: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, rollNo: string };
    req.user = decoded;
    
    // Heartbeat: non-blocking registration in online_users ZSET
    redisConnection.zadd('online_users', Date.now(), decoded.id).catch((err) => {
      logger.error(`[Heartbeat] Failed to record active user ${decoded.id}:`, err);
    });

    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, rollNo: string };
    req.user = decoded;

    // Heartbeat: non-blocking registration in online_users ZSET
    redisConnection.zadd('online_users', Date.now(), decoded.id).catch((err) => {
      logger.error(`[Heartbeat] Failed to record active user ${decoded.id}:`, err);
    });

    next();
  } catch (error) {
    // If token is invalid, just proceed without user info
    next();
  }
};
