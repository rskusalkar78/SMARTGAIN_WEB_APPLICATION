import express from 'express';
import nutritionController from '../controllers/nutritionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/v1/nutrition/calculate
 * @desc    Calculate daily calorie and macro recommendations
 * @access  Public (no auth required for calculator)
 */
router.post('/calculate', nutritionController.calculate);

/**
 * @route   GET /api/v1/nutrition/meal-plan
 * @desc    Get current meal plan for user
 * @access  Private
 */
router.get('/meal-plan', authenticateToken, nutritionController.getMealPlan);

/**
 * @route   POST /api/v1/nutrition/log
 * @desc    Log daily calorie intake
 * @access  Private
 */
router.post('/log', authenticateToken, nutritionController.logCalories);

export default router;
