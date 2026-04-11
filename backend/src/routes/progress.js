import express from 'express';
import progressController from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/v1/progress/analytics
 * @desc    Get progress analytics for user
 * @access  Private
 */
router.get('/analytics', authenticateToken, progressController.getAnalytics);

export default router;
