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
import { register } from './observability/metrics/registry';

const app = express();
app.use(requestLogger);
app.use(metricsMiddleware);
app.set('trust proxy', true);

app.use(compression());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use(errorHandler);

export { app };
