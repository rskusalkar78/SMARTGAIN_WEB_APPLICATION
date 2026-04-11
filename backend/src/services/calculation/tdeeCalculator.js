/**
 * TDEE (Total Daily Energy Expenditure) and Weight Gain Calculator Service
 * Implements TDEE calculation with activity levels and weight gain calorie additions
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import Joi from 'joi';
import { ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import { calculateBMR } from './bmrCalculator.js';

/**
 * Activity level multipliers for Harris-Benedict equation
 * Standard multipliers based on activity level frequency
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,        // Minimal activity, mostly sedentary
  light: 1.375,          // Light activity (1-3 days/week exercise)
  moderate: 1.55,        // Moderate activity (3-5 days/week exercise)
  very: 1.725,           // Very active (6-7 days/week heavy exercise)
  extreme: 1.9,          // Extremely active (intense daily exercise)
};

/**
 * Safe weight gain calorie ranges based on goal intensity
 * Conservative = slower gain, moderate = steady gain, aggressive = faster gain
 */
const CALORIE_SURPLUS_BY_INTENSITY = {
  conservative: { min: 300, max: 400 },      // 0.2-0.25 kg/week
  moderate: { min: 400, max: 500 },          // 0.25-0.3 kg/week
  aggressive: { min: 500, max: 650 },        // 0.3-0.4 kg/week
};

/**
 * Validates TDEE calculation input parameters
 * @param {Object} data - Input data with BMR, activityLevel, weeklyWeightGain, goalIntensity
 * @throws {ValidationError} If validation fails
 */
function validateTDEEInput(data) {
  const schema = Joi.object({
    bmr: Joi.number()
      .positive()
      .min(500)
      .max(5000)
      .required()
      .messages({
        'number.base': 'BMR must be a number',
        'number.positive': 'BMR must be positive',
        'number.min': 'BMR must be at least 500 kcal',
        'number.max': 'BMR cannot exceed 5000 kcal',
        'any.required': 'BMR is required'
      }),
    activityLevel: Joi.string()
      .valid('sedentary', 'light', 'moderate', 'very', 'extreme')
      .required()
      .messages({
        'any.only': 'Activity level must be one of: sedentary, light, moderate, very, extreme',
        'any.required': 'Activity level is required'
      }),
    weeklyWeightGain: Joi.number()
      .min(0.1)
      .max(2.0)
      .optional()
      .messages({
        'number.min': 'Weekly weight gain must be at least 0.1 kg',
        'number.max': 'Weekly weight gain cannot exceed 2.0 kg'
      }),
    goalIntensity: Joi.string()
      .valid('conservative', 'moderate', 'aggressive')
      .optional()
      .messages({
        'any.only': 'Goal intensity must be one of: conservative, moderate, aggressive'
      })
  });

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new ValidationError(
      `TDEE calculation validation failed: ${messages.join(', ')}`
    );
  }

  return value;
}

/**
 * Calculates TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × Activity Multiplier
 * 
 * @param {number} bmr - Basal Metabolic Rate in kcal
 * @param {string} activityLevel - Activity level (sedentary, light, moderate, very, extreme)
 * @returns {number} TDEE in calories per day (rounded to nearest whole number)
 * @throws {ValidationError} If input validation fails
 */
function calculateTDEE(bmr, activityLevel) {
  try {
    const validatedData = validateTDEEInput({
      bmr,
      activityLevel
    });

    const { bmr: validBMR, activityLevel: validActivityLevel } = validatedData;
    const multiplier = ACTIVITY_MULTIPLIERS[validActivityLevel];
    const tdee = Math.round(validBMR * multiplier);

    logger.debug('TDEE calculated successfully', {
      bmr: validBMR,
      activityLevel: validActivityLevel,
      multiplier,
      tdee
    });

    return tdee;
  } catch (error) {
    logger.error('TDEE calculation failed', {
      error: error.message,
      bmr,
      activityLevel
    });
    throw error;
  }
}

/**
 * Calculates weight gain target calories
 * Uses weekly weight gain goal or goal intensity to determine calorie surplus
 * 
 * Conversion: 1 kg body weight ≈ 7700 kcal
 * So weekly weight gain = (weekly calorie surplus) / 7700
 * 
 * @param {number} weeklyWeightGain - Target weekly weight gain in kg (0.1-2.0)
 * @param {string} goalIntensity - Goal intensity for calorie calculation (conservative/moderate/aggressive)
 * @returns {number} Recommended daily calorie surplus in kcal
 */
function calculateWeightGainCalories(weeklyWeightGain, goalIntensity = 'moderate') {
  try {
    if (weeklyWeightGain && weeklyWeightGain < 0.1 || weeklyWeightGain > 2.0) {
      throw new ValidationError(
        'Weekly weight gain must be between 0.1 and 2.0 kg'
      );
    }

    if (!['conservative', 'moderate', 'aggressive'].includes(goalIntensity)) {
      throw new ValidationError(
        'Goal intensity must be one of: conservative, moderate, aggressive'
      );
    }

    let dailyCalorieSurplus;

    if (weeklyWeightGain) {
      // Calculate based on weight gain: 1 kg ≈ 7700 kcal
      // Weekly surplus = weeklyWeightGain * 7700
      // Daily surplus = weekly / 7
      const weeklyCaloriesSurplus = weeklyWeightGain * 7700;
      dailyCalorieSurplus = Math.round(weeklyCaloriesSurplus / 7);
    } else {
      // Calculate based on goal intensity
      const intensityRange = CALORIE_SURPLUS_BY_INTENSITY[goalIntensity];
      // Use middle of range for consistency
      dailyCalorieSurplus = Math.round(
        (intensityRange.min + intensityRange.max) / 2
      );
    }

    // Safety thresholds
    if (dailyCalorieSurplus < 250) {
      dailyCalorieSurplus = 250; // Minimum for healthy weight gain
    }
    if (dailyCalorieSurplus > 750) {
      dailyCalorieSurplus = 750; // Maximum to prevent excess fat gain
    }

    logger.debug('Weight gain calories calculated successfully', {
      weeklyWeightGain,
      goalIntensity,
      dailyCalorieSurplus
    });

    return dailyCalorieSurplus;
  } catch (error) {
    logger.error('Weight gain calorie calculation failed', {
      error: error.message,
      weeklyWeightGain,
      goalIntensity
    });
    throw error;
  }
}

/**
 * Calculates total daily caloric intake needed for weight gain goal
 * This is TDEE + Weight Gain Calorie Surplus
 * 
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {number} weightGainCalories - Daily calorie surplus for weight gain
 * @returns {number} Total daily caloric intake needed
 */
function calculateTotalCalorieTarget(tdee, weightGainCalories) {
  if (!tdee || typeof tdee !== 'number' || tdee <= 0) {
    throw new ValidationError('TDEE must be a positive number');
  }
  if (!weightGainCalories || typeof weightGainCalories !== 'number' || weightGainCalories < 0) {
    throw new ValidationError('Weight gain calories must be a non-negative number');
  }

  const totalCalories = Math.round(tdee + weightGainCalories);

  logger.debug('Total calorie target calculated', {
    tdee,
    weightGainCalories,
    totalCalories
  });

  return totalCalories;
}

/**
 * Complete calculation pipeline: BMR → TDEE → Weight Gain Calories
 * 
 * @param {Object} userData - User profile and goal data
 * @returns {Object} Complete calculation breakdown
 */
function calculateCompleteCaloriePlan(userData) {
  try {
    const {
      age,
      gender,
      weight,
      height,
      activityLevel,
      weeklyWeightGain,
      goalIntensity = 'moderate'
    } = userData;

    // Step 1: Calculate BMR
    const bmr = calculateBMR({
      age,
      gender,
      weight,
      height
    });

    // Step 2: Calculate TDEE
    const tdee = calculateTDEE(bmr, activityLevel);

    // Step 3: Calculate weight gain calories
    const weightGainCalories = calculateWeightGainCalories(
      weeklyWeightGain,
      goalIntensity
    );

    // Step 4: Calculate total calorie target
    const totalCalories = calculateTotalCalorieTarget(tdee, weightGainCalories);

    // Calculate implied weekly gain based on surplus
    const weeklyCalorieSurplus = weightGainCalories * 7;
    const impliedWeeklyGain = parseFloat((weeklyCalorieSurplus / 7700).toFixed(2));

    logger.debug('Complete calorie plan calculated', {
      bmr,
      tdee,
      weightGainCalories,
      totalCalories,
      impliedWeeklyGain
    });

    return {
      bmr,
      tdee,
      activityMultiplier: ACTIVITY_MULTIPLIERS[activityLevel],
      weightGainCalories,
      impliedWeeklyGain,
      totalCalories,
      breakdown: {
        maintenance: tdee,
        surplus: weightGainCalories,
        total: totalCalories
      }
    };
  } catch (error) {
    logger.error('Complete calorie plan calculation failed', {
      error: error.message,
      userData
    });
    throw error;
  }
}

/**
 * Validates if calorie plan is safe and reasonable
 * 
 * @param {number} totalCalories - Total daily calorie target
 * @param {number} bmr - Basal Metabolic Rate
 * @returns {Object} Validation result with safe flag and warnings
 */
function validateCaloriePlan(totalCalories, bmr) {
  const warnings = [];
  let safe = true;

  // Should be above BMR
  if (totalCalories < bmr) {
    warnings.push('Calorie target is below BMR - weight loss expected');
    safe = false;
  }

  // Should not exceed 4x BMR (extreme surplus)
  if (totalCalories > bmr * 4) {
    warnings.push('Calorie target is very high - excessive fat gain likely');
    safe = false;
  }

  // Surplus should not exceed 1000 kcal/day
  const surplus = totalCalories - bmr;
  if (surplus > 1000) {
    warnings.push('Daily surplus exceeds 1000 kcal - higher fat gain risk');
    safe = false;
  }

  // Surplus should be at least 200 kcal/day for weight gain
  if (surplus < 200) {
    warnings.push('Daily surplus is less than 200 kcal - minimal weight gain expected');
  }

  return {
    safe,
    warnings,
    surplus,
    recommendation: safe ? 'Plan is safe and reasonable' : 'Review plan carefully'
  };
}

export {
  calculateTDEE,
  calculateWeightGainCalories,
  calculateTotalCalorieTarget,
  calculateCompleteCaloriePlan,
  validateCaloriePlan,
  validateTDEEInput,
  ACTIVITY_MULTIPLIERS,
  CALORIE_SURPLUS_BY_INTENSITY
};
