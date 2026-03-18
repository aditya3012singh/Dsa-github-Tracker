import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import studentRoutes from './routes/student.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import authRoutes from './routes/auth.routes';

const app = express();

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
