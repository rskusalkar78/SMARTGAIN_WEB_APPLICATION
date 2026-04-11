import express from 'express';
import statsController from '../controllers/statsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/v1/stats/body
 * @desc    Log body stats (weight, measurements, etc.)
 * @access  Private
 */
router.post('/body', authenticateToken, statsController.logBodyStats);

export default router;
