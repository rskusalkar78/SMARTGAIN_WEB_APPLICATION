import User from '../models/User.js';
import { calculateBMR } from '../services/calculation/bmrCalculator.js';
import { calculateTDEE, calculateWeightGainCalories } from '../services/calculation/tdeeCalculator.js';
import { calculateMacroTargets } from '../services/nutrition/macroCalculator.js';
import logger from '../utils/logger.js';

class PlansController {
  /**
   * Update user plans (calorie and workout adjustments)
   * PUT /api/v1/plans/update
   */
  async updatePlans(req, res) {
    try {
      const userId = req.userId;
      const { calorieAdjustment, macroAdjustments, workoutAdjustments, reason } = req.body;
      
      // Fetch user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      let updated = false;
      const changes = {};
      
      // Apply calorie adjustment
      if (calorieAdjustment && typeof calorieAdjustment === 'number') {
        const newTargetCalories = user.calculations.targetCalories + calorieAdjustment;
        
        // Recalculate macros with new calorie target
        const newMacros = calculateMacroTargets(
          newTargetCalories,
          user.profile.currentWeight,
          user.profile.activityLevel || 'moderate'
        );
        
        user.calculations.targetCalories = newTargetCalories;
        user.calculations.macroTargets = {
          protein: newMacros.macros.protein.grams,
          carbs: newMacros.macros.carbs.grams,
          fat: newMacros.macros.fats.grams
        };
        user.calculations.lastCalculated = new Date();
        
        changes.calories = {
          old: user.calculations.targetCalories - calorieAdjustment,
          new: newTargetCalories,
          adjustment: calorieAdjustment
        };
        
        updated = true;
      }
      
      // Apply macro adjustments
      if (macroAdjustments && typeof macroAdjustments === 'object') {
        if (macroAdjustments.protein) {
          user.calculations.macroTargets.protein += macroAdjustments.protein;
          changes.protein = macroAdjustments.protein;
          updated = true;
        }
        if (macroAdjustments.carbs) {
          user.calculations.macroTargets.carbs += macroAdjustments.carbs;
          changes.carbs = macroAdjustments.carbs;
          updated = true;
        }
        if (macroAdjustments.fat) {
          user.calculations.macroTargets.fat += macroAdjustments.fat;
          changes.fat = macroAdjustments.fat;
          updated = true;
        }
      }
      
      // Note: Workout adjustments would be applied to workout logs/plans
      // For now, we just acknowledge them
      if (workoutAdjustments) {
        changes.workoutAdjustments = workoutAdjustments;
      }
      
      if (!updated) {
        return res.status(400).json({
          error: {
            code: 'NO_CHANGES',
            message: 'No valid adjustments provided',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Save user
      await user.save();
      
      logger.info('User plans updated', {
        userId,
        changes,
        reason: reason || 'Manual adjustment'
      });
      
      res.status(200).json({
        success: true,
        message: 'Plans updated successfully',
        data: {
          changes,
          reason: reason || 'Manual adjustment',
          newCalculations: {
            targetCalories: user.calculations.targetCalories,
            macroTargets: user.calculations.macroTargets
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update plans', {
        userId: req.userId,
        error: error.message
      });
      
      res.status(500).json({
        error: {
          code: 'PLAN_UPDATE_FAILED',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export default new PlansController();
