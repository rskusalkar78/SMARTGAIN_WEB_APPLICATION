/**
 * Adaptive Intelligence Service
 * Monitors user progress and automatically adjusts nutrition and workout plans
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */

import BodyStats from '../../models/BodyStats.js';
import WorkoutLog from '../../models/WorkoutLog.js';
import AdaptationLog from '../../models/AdaptationLog.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Analyzes weight trends over a specified timeframe
 * Detects stagnation (no gain for 14 days) and rapid gain (>1kg/week)
 * Requirements: 6.1, 6.2
 * 
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze (default: 14)
 * @returns {Object} Weight trend analysis
 */
async function analyzeWeightTrend(userId, days = 14) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const bodyStats = await BodyStats.getStatsInRange(userId, startDate, new Date());
    
    if (bodyStats.length < 2) {
      return {
        hasData: false,
        message: 'Insufficient data for trend analysis',
        dataPoints: bodyStats.length
      };
    }
    
    // Sort by date ascending for trend analysis
    bodyStats.sort((a, b) => a.date - b.date);
    
    const oldestWeight = bodyStats[0].weight;
    const latestWeight = bodyStats[bodyStats.length - 1].weight;
    const weightChange = latestWeight - oldestWeight;
    
    // Calculate days between measurements
    const daysBetween = Math.ceil(
      (bodyStats[bodyStats.length - 1].date - bodyStats[0].date) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate weekly rate
    const weeklyRate = daysBetween > 0 ? (weightChange / daysBetween) * 7 : 0;
    
    // Detect stagnation: no gain for 14 days (weight change < 0.2kg)
    const isStagnant = days >= 14 && weightChange < 0.2;
    
    // Detect rapid gain: >1kg per week
    const isRapidGain = weeklyRate > 1.0;
    
    logger.debug('Weight trend analyzed', {
      userId,
      days,
      dataPoints: bodyStats.length,
      oldestWeight,
      latestWeight,
      weightChange,
      weeklyRate,
      isStagnant,
      isRapidGain
    });
    
    return {
      hasData: true,
      dataPoints: bodyStats.length,
      oldestWeight,
      latestWeight,
      weightChange,
      daysBetween,
      weeklyRate,
      isStagnant,
      isRapidGain,
      trend: weightChange > 0.5 ? 'gaining' : weightChange < -0.2 ? 'losing' : 'stable'
    };
  } catch (error) {
    logger.error('Failed to analyze weight trend', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Analyzes workout data to detect overtraining patterns
 * Requirements: 6.3
 * 
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Object} Overtraining analysis
 */
async function analyzeOvertrainingPatterns(userId, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const workouts = await WorkoutLog.getWorkoutsInRange(userId, startDate, new Date());
    
    if (workouts.length === 0) {
      return {
        hasData: false,
        message: 'No workout data available',
        overtrainingDetected: false
      };
    }
    
    // Calculate metrics
    const totalWorkouts = workouts.length;
    const highIntensityWorkouts = workouts.filter(w => w.intensity === 'high').length;
    const averageDuration = workouts.reduce((sum, w) => sum + w.duration, 0) / totalWorkouts;
    
    // Check for consecutive high-intensity days
    let consecutiveHighIntensity = 0;
    let maxConsecutiveHighIntensity = 0;
    
    for (let i = 0; i < workouts.length; i++) {
      if (workouts[i].intensity === 'high') {
        consecutiveHighIntensity++;
        maxConsecutiveHighIntensity = Math.max(maxConsecutiveHighIntensity, consecutiveHighIntensity);
      } else {
        consecutiveHighIntensity = 0;
      }
    }
    
    // Overtraining indicators
    const indicators = {
      highFrequency: totalWorkouts > 6, // More than 6 workouts in 7 days
      excessiveHighIntensity: highIntensityWorkouts >= 5, // 5+ high intensity in 7 days
      longAverageDuration: averageDuration > 120, // Average > 2 hours
      consecutiveHighIntensity: maxConsecutiveHighIntensity >= 3 // 3+ consecutive high intensity
    };
    
    const overtrainingScore = Object.values(indicators).filter(Boolean).length;
    const overtrainingDetected = overtrainingScore >= 2;
    
    logger.debug('Overtraining analysis completed', {
      userId,
      totalWorkouts,
      highIntensityWorkouts,
      averageDuration,
      maxConsecutiveHighIntensity,
      overtrainingScore,
      overtrainingDetected
    });
    
    return {
      hasData: true,
      totalWorkouts,
      highIntensityWorkouts,
      averageDuration,
      maxConsecutiveHighIntensity,
      indicators,
      overtrainingScore,
      overtrainingDetected,
      riskLevel: overtrainingScore >= 3 ? 'high' : overtrainingScore >= 2 ? 'moderate' : 'low',
      recommendation: overtrainingDetected ? 'Reduce workout volume and add rest days' : 'Continue current workout plan'
    };
  } catch (error) {
    logger.error('Failed to analyze overtraining patterns', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Calculates calorie adjustment based on weight trend
 * Adjusts by ±100-150 calories based on stagnation or rapid gain
 * Requirements: 6.1, 6.2
 * 
 * @param {Object} weightTrend - Weight trend analysis result
 * @param {Object} user - User document
 * @returns {number} Calorie adjustment amount
 */
function calculateCalorieAdjustment(weightTrend, user) {
  if (!weightTrend.hasData) {
    return 0;
  }
  
  // Weight stagnation: increase calories by 100-150
  if (weightTrend.isStagnant) {
    const adjustment = user.goals.goalIntensity === 'aggressive' ? 150 : 
                      user.goals.goalIntensity === 'moderate' ? 125 : 100;
    logger.debug('Calorie increase recommended for stagnation', {
      userId: user._id,
      adjustment
    });
    return adjustment;
  }
  
  // Rapid gain: decrease calories by 100-150
  if (weightTrend.isRapidGain) {
    const adjustment = user.goals.goalIntensity === 'conservative' ? -150 : 
                      user.goals.goalIntensity === 'moderate' ? -125 : -100;
    logger.debug('Calorie decrease recommended for rapid gain', {
      userId: user._id,
      adjustment
    });
    return adjustment;
  }
  
  // No adjustment needed
  return 0;
}

/**
 * Calculates macro ratio adjustments based on body composition changes
 * Requirements: 6.4
 * 
 * @param {Object} weightTrend - Weight trend analysis result
 * @param {Object} user - User document
 * @returns {Object} Macro adjustments in grams
 */
function calculateMacroAdjustments(weightTrend, user) {
  const adjustments = {
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  if (!weightTrend.hasData || !user.calculations.targetCalories) {
    return adjustments;
  }
  
  // If gaining too fast, reduce carbs slightly (reduce by 5%)
  if (weightTrend.isRapidGain) {
    const currentCarbs = user.calculations.macroTargets.carbs || 0;
    adjustments.carbs = -Math.round(currentCarbs * 0.05);
    
    logger.debug('Macro adjustment for rapid gain', {
      userId: user._id,
      carbReduction: adjustments.carbs
    });
  }
  
  // If stagnant, increase carbs slightly (increase by 5%)
  if (weightTrend.isStagnant) {
    const currentCarbs = user.calculations.macroTargets.carbs || 0;
    adjustments.carbs = Math.round(currentCarbs * 0.05);
    
    logger.debug('Macro adjustment for stagnation', {
      userId: user._id,
      carbIncrease: adjustments.carbs
    });
  }
  
  return adjustments;
}

/**
 * Generates workout plan modification suggestions
 * Requirements: 6.5
 * 
 * @param {Object} overtrainingAnalysis - Overtraining analysis result
 * @param {Object} weightTrend - Weight trend analysis result
 * @returns {Object} Workout adjustments
 */
function calculateWorkoutAdjustments(overtrainingAnalysis, weightTrend) {
  const adjustments = {
    volumeChange: 0,
    intensityChange: 'maintain',
    restDaysAdded: 0
  };
  
  // Overtraining detected: reduce volume and add rest
  if (overtrainingAnalysis.overtrainingDetected) {
    adjustments.volumeChange = -20; // Reduce volume by 20%
    adjustments.intensityChange = 'decrease';
    adjustments.restDaysAdded = overtrainingAnalysis.riskLevel === 'high' ? 2 : 1;
    
    logger.debug('Workout reduction recommended for overtraining', {
      riskLevel: overtrainingAnalysis.riskLevel,
      adjustments
    });
    
    return adjustments;
  }
  
  // Good progress: maintain or slightly increase
  if (weightTrend.hasData && weightTrend.trend === 'gaining' && !weightTrend.isRapidGain) {
    adjustments.intensityChange = 'maintain';
    
    logger.debug('Maintain current workout plan', {
      trend: weightTrend.trend
    });
  }
  
  return adjustments;
}

/**
 * Performs comprehensive progress analysis and generates adaptation recommendations
 * Main entry point for adaptive intelligence
 * Requirements: 6.1, 6.2, 6.4, 6.5
 * 
 * @param {string} userId - User ID
 * @returns {Object} Complete progress analysis and recommendations
 */
async function analyzeProgressAndAdapt(userId) {
  try {
    logger.info('Starting progress analysis', { userId });
    
    // Fetch user data
    const user = await User.findById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }
    
    // Analyze weight trends (14 days for stagnation detection)
    const weightTrend = await analyzeWeightTrend(userId, 14);
    
    // Analyze overtraining patterns (7 days)
    const overtrainingAnalysis = await analyzeOvertrainingPatterns(userId, 7);
    
    // Calculate adjustments
    const calorieAdjustment = calculateCalorieAdjustment(weightTrend, user);
    const macroAdjustments = calculateMacroAdjustments(weightTrend, user);
    const workoutAdjustments = calculateWorkoutAdjustments(overtrainingAnalysis, weightTrend);
    
    // Determine if adaptation is needed
    const adaptationNeeded = calorieAdjustment !== 0 || 
                            overtrainingAnalysis.overtrainingDetected ||
                            Object.values(macroAdjustments).some(v => v !== 0);
    
    const analysis = {
      userId,
      timestamp: new Date(),
      weightTrend,
      overtrainingAnalysis,
      recommendations: {
        calorieAdjustment,
        macroAdjustments,
        workoutAdjustments
      },
      adaptationNeeded,
      summary: generateAdaptationSummary(weightTrend, overtrainingAnalysis, calorieAdjustment)
    };
    
    logger.info('Progress analysis completed', {
      userId,
      adaptationNeeded,
      calorieAdjustment,
      overtrainingDetected: overtrainingAnalysis.overtrainingDetected
    });
    
    return analysis;
  } catch (error) {
    logger.error('Failed to analyze progress', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Creates and saves an adaptation log based on analysis
 * Requirements: 6.1, 6.2, 6.4, 6.5
 * 
 * @param {string} userId - User ID
 * @param {Object} analysis - Progress analysis result
 * @returns {Object} Created adaptation log
 */
async function createAdaptation(userId, analysis) {
  try {
    if (!analysis.adaptationNeeded) {
      logger.debug('No adaptation needed', { userId });
      return null;
    }
    
    // Determine trigger
    let trigger = 'scheduled_review';
    if (analysis.weightTrend.isStagnant) {
      trigger = 'weight_stagnation';
    } else if (analysis.weightTrend.isRapidGain) {
      trigger = 'rapid_gain';
    } else if (analysis.overtrainingAnalysis.overtrainingDetected) {
      trigger = 'overtraining';
    }
    
    // Create adaptation log
    const adaptation = new AdaptationLog({
      userId,
      date: new Date(),
      trigger,
      changes: {
        calorieAdjustment: analysis.recommendations.calorieAdjustment,
        macroAdjustments: analysis.recommendations.macroAdjustments,
        workoutAdjustments: analysis.recommendations.workoutAdjustments
      },
      reasoning: analysis.summary,
      effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    });
    
    await adaptation.save();
    
    logger.info('Adaptation created', {
      userId,
      adaptationId: adaptation._id,
      trigger,
      calorieAdjustment: analysis.recommendations.calorieAdjustment
    });
    
    return adaptation;
  } catch (error) {
    logger.error('Failed to create adaptation', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Applies pending adaptations for a user
 * 
 * @param {string} userId - User ID
 * @returns {Array} Applied adaptations
 */
async function applyPendingAdaptations(userId) {
  try {
    const pendingAdaptations = await AdaptationLog.getPendingAdaptations(userId);
    
    if (pendingAdaptations.length === 0) {
      logger.debug('No pending adaptations', { userId });
      return [];
    }
    
    const appliedAdaptations = [];
    
    for (const adaptation of pendingAdaptations) {
      try {
        await adaptation.applyToUser();
        appliedAdaptations.push(adaptation);
        
        logger.info('Adaptation applied', {
          userId,
          adaptationId: adaptation._id,
          trigger: adaptation.trigger
        });
      } catch (error) {
        logger.error('Failed to apply adaptation', {
          userId,
          adaptationId: adaptation._id,
          error: error.message
        });
      }
    }
    
    return appliedAdaptations;
  } catch (error) {
    logger.error('Failed to apply pending adaptations', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Generates a human-readable summary of the adaptation reasoning
 * 
 * @param {Object} weightTrend - Weight trend analysis
 * @param {Object} overtrainingAnalysis - Overtraining analysis
 * @param {number} calorieAdjustment - Calorie adjustment amount
 * @returns {string} Summary text
 */
function generateAdaptationSummary(weightTrend, overtrainingAnalysis, calorieAdjustment) {
  const parts = [];
  
  if (weightTrend.isStagnant) {
    parts.push(`Weight has remained stable at ${weightTrend.latestWeight.toFixed(1)}kg over the past ${weightTrend.daysBetween} days with minimal gain (${weightTrend.weightChange.toFixed(2)}kg).`);
    parts.push(`Increasing daily calories by ${calorieAdjustment} to stimulate weight gain.`);
  }
  
  if (weightTrend.isRapidGain) {
    parts.push(`Weight is increasing rapidly at ${weightTrend.weeklyRate.toFixed(2)}kg per week, which exceeds the recommended rate.`);
    parts.push(`Reducing daily calories by ${Math.abs(calorieAdjustment)} to slow down weight gain and minimize fat accumulation.`);
  }
  
  if (overtrainingAnalysis.overtrainingDetected) {
    parts.push(`Overtraining indicators detected: ${overtrainingAnalysis.totalWorkouts} workouts in 7 days with ${overtrainingAnalysis.highIntensityWorkouts} high-intensity sessions.`);
    parts.push(`Recommending ${overtrainingAnalysis.riskLevel} risk mitigation: reduce workout volume by 20% and add rest days.`);
  }
  
  if (parts.length === 0) {
    parts.push('Progress is on track. Continue with current plan.');
  }
  
  return parts.join(' ');
}

export {
  analyzeWeightTrend,
  analyzeOvertrainingPatterns,
  calculateCalorieAdjustment,
  calculateMacroAdjustments,
  calculateWorkoutAdjustments,
  analyzeProgressAndAdapt,
  createAdaptation,
  applyPendingAdaptations,
  generateAdaptationSummary
};
