import express from 'express';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import nutritionRoutes from './nutrition.js';
import workoutRoutes from './workout.js';
import progressRoutes from './progress.js';
import plansRoutes from './plans.js';
import statsRoutes from './stats.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartGain Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/workout', workoutRoutes);
router.use('/progress', progressRoutes);
router.use('/plans', plansRoutes);
router.use('/stats', statsRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;