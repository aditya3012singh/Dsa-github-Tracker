import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import studentRoutes from './routes/student.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import { requestLogger } from './middleware/requestLogger';
import { metricsMiddleware } from './observability/metrics/metricsMiddleware';
import metricsRoutes from './routes/metrics.routes';

const app = express();
app.set('trust proxy', true);
app.use(requestLogger);
app.use(metricsMiddleware);

app.use(compression());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Operational routes (health, metrics, etc.)
app.use(metricsRoutes);

// Global error handler
app.use(errorHandler);

export { app };
