import { calculateBMR } from '../calculation/bmrCalculator.js';
import { calculateTDEE, calculateWeightGainCalories } from '../calculation/tdeeCalculator.js';
import { calculateMacroTargets } from '../nutrition/macroCalculator.js';
import logger from '../../utils/logger.js';

/**
 * Recalculate all user metrics when profile is updated
 * @param {Object} user - User document
 * @returns {Object} Updated calculations
 */
export async function recalculateUserMetrics(user) {
  try {
    const { age, gender, height, currentWeight, activityLevel } = user.profile;
    const { goalIntensity } = user.goals;

    // Calculate BMR
    const bmr = calculateBMR(currentWeight, height, age, gender);
    
    // Calculate TDEE
    const tdee = calculateTDEE(bmr, activityLevel);
    
    // Calculate weight gain calories
    const weightGainCalories = calculateWeightGainCalories(tdee, goalIntensity);
    
    // Calculate macro targets
    const macroResult = calculateMacroTargets(
      weightGainCalories,
      currentWeight,
      activityLevel
    );

    // Update user calculations
    user.calculations.bmr = bmr;
    user.calculations.tdee = tdee;
    user.calculations.targetCalories = weightGainCalories;
    user.calculations.macroTargets = {
      protein: macroResult.macros.protein.grams,
      carbs: macroResult.macros.carbs.grams,
      fat: macroResult.macros.fats.grams
    };
    user.calculations.lastCalculated = new Date();

    logger.info('User metrics recalculated', {
      userId: user._id,
      bmr,
      tdee,
      targetCalories: weightGainCalories
    });

    return {
      bmr,
      tdee,
      targetCalories: weightGainCalories,
      macroTargets: user.calculations.macroTargets
    };
  } catch (error) {
    logger.error('Failed to recalculate user metrics', {
      userId: user._id,
      error: error.message
    });
    throw error;
  }
}

/**
 * Check if user profile changes require recalculation
 * @param {Object} updates - Profile update fields
 * @returns {boolean} Whether recalculation is needed
 */
export function requiresRecalculation(updates) {
  const calculationFields = [
    'profile.age',
    'profile.height',
    'profile.currentWeight',
    'profile.activityLevel',
    'goals.goalIntensity'
  ];

  return Object.keys(updates).some(key => calculationFields.includes(key));
}
