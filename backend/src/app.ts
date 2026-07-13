import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import studentRoutes from './routes/student.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import { requestLogger } from './middleware/requestLogger';

const app = express();
app.use(requestLogger);
app.set('trust proxy', true);

app.use(compression());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use(errorHandler);

export { app };
