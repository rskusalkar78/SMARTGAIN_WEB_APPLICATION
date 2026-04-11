/**
 * Calculation Service Module
 * Exports all calculation-related functions for the SmartGain backend
 */

import {
  calculateBMR,
  calculateBMRWithBreakdown,
  validateBMRInput,
} from './bmrCalculator.js';

import {
  calculateTDEE,
  calculateWeightGainCalories,
  calculateTotalCalorieTarget,
  calculateCompleteCaloriePlan,
  validateCaloriePlan,
  validateTDEEInput,
  ACTIVITY_MULTIPLIERS,
  CALORIE_SURPLUS_BY_INTENSITY
} from './tdeeCalculator.js';

import logger from '../../utils/logger.js';

/**
 * Recalculates and updates user's BMR, TDEE, and calorie targets
 * Triggered when user stats are updated (weight, height, age, activity level)
 * Requirements: 3.5
 * 
 * @param {Object} user - User document from MongoDB
 * @returns {Object} Updated calculation values
 */
async function recalculateUserRecommendations(user) {
  try {
    logger.debug('Starting recalculation for user', {
      userId: user._id,
      lastCalculated: user.calculations.lastCalculated
    });

    // Extract user data for calculations
    const userData = {
      age: user.profile.age,
      gender: user.profile.gender,
      weight: user.profile.currentWeight,
      height: user.profile.height,
      activityLevel: user.profile.activityLevel,
      weeklyWeightGain: user.goals.weeklyWeightGain,
      goalIntensity: user.goals.goalIntensity
    };

    // Calculate complete calorie plan
    const caloriePlan = calculateCompleteCaloriePlan(userData);

    // Update user's calculations
    user.calculations.bmr = caloriePlan.bmr;
    user.calculations.tdee = caloriePlan.tdee;
    user.calculations.targetCalories = caloriePlan.totalCalories;
    user.calculations.lastCalculated = new Date();

    // Calculate macro targets (basic implementation)
    const proteinCalories = Math.round(caloriePlan.totalCalories * 0.275); // 27.5% average
    const carbCalories = Math.round(caloriePlan.totalCalories * 0.50); // 50% average
    const fatCalories = Math.round(caloriePlan.totalCalories * 0.225); // 22.5% average

    user.calculations.macroTargets = {
      protein: Math.round(proteinCalories / 4), // 4 kcal per gram
      carbs: Math.round(carbCalories / 4), // 4 kcal per gram
      fat: Math.round(fatCalories / 9) // 9 kcal per gram
    };

    // Save updated user
    await user.save();

    logger.info('User calculations updated successfully', {
      userId: user._id,
      bmr: caloriePlan.bmr,
      tdee: caloriePlan.tdee,
      targetCalories: caloriePlan.totalCalories,
      macroTargets: user.calculations.macroTargets
    });

    return {
      bmr: caloriePlan.bmr,
      tdee: caloriePlan.tdee,
      targetCalories: caloriePlan.totalCalories,
      weightGainCalories: caloriePlan.weightGainCalories,
      impliedWeeklyGain: caloriePlan.impliedWeeklyGain,
      macroTargets: user.calculations.macroTargets,
      breakdown: caloriePlan.breakdown,
      lastCalculated: user.calculations.lastCalculated
    };
  } catch (error) {
    logger.error('Failed to recalculate user recommendations', {
      userId: user._id,
      error: error.message
    });
    throw error;
  }
}

/**
 * Checks if user needs recalculation and performs it if necessary
 * Can be called before returning user data to ensure freshness
 * 
 * @param {Object} user - User document from MongoDB
 * @returns {Object} Current or updated calculation values
 */
async function ensureCalculationsAreCurrent(user) {
  if (user.needsRecalculation()) {
    logger.debug('User calculations are stale, recalculating', {
      userId: user._id,
      lastCalculated: user.calculations.lastCalculated
    });
    return await recalculateUserRecommendations(user);
  }

  logger.debug('User calculations are current', {
    userId: user._id,
    lastCalculated: user.calculations.lastCalculated
  });

  return {
    bmr: user.calculations.bmr,
    tdee: user.calculations.tdee,
    targetCalories: user.calculations.targetCalories,
    macroTargets: user.calculations.macroTargets,
    lastCalculated: user.calculations.lastCalculated
  };
}

export {
  // BMR Calculations
  calculateBMR,
  calculateBMRWithBreakdown,
  validateBMRInput,
  
  // TDEE and Weight Gain Calculations
  calculateTDEE,
  calculateWeightGainCalories,
  calculateTotalCalorieTarget,
  calculateCompleteCaloriePlan,
  validateCaloriePlan,
  validateTDEEInput,
  ACTIVITY_MULTIPLIERS,
  CALORIE_SURPLUS_BY_INTENSITY,

  // Recalculation Functions
  recalculateUserRecommendations,
  ensureCalculationsAreCurrent
};
