import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import studentRoutes from './routes/student.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import authRoutes from './routes/auth.routes';
import morgan from 'morgan';
import { logger } from './utils/logger';

const app = express();

app.set('trust proxy', true);

app.use(compression());
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) } 
}));
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use(errorHandler);

export { app };
