import express from 'express';
import workoutController from '../controllers/workoutController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/v1/workout/current-plan
 * @desc    Get current workout plan for user
 * @access  Private
 */
router.get('/current-plan', authenticateToken, workoutController.getCurrentPlan);

/**
 * @route   POST /api/v1/workout/log
 * @desc    Log workout session
 * @access  Private
 */
router.post('/log', authenticateToken, workoutController.logWorkout);

export default router;
