import express from 'express';
import plansController from '../controllers/plansController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   PUT /api/v1/plans/update
 * @desc    Update user plans (calorie and workout adjustments)
 * @access  Private
 */
router.put('/update', authenticateToken, plansController.updatePlans);

export default router;
