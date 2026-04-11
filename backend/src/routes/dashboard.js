import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/v1/dashboard/summary
 * @desc    Get dashboard summary with current stats and recommendations
 * @access  Private
 */
router.get('/summary', authenticateToken, dashboardController.getSummary);

export default router;
