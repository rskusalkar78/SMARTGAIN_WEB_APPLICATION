import { analyzeProgressAndAdapt } from '../adaptive/adaptiveIntelligence.js';
import progressTracker from '../progress/progressTracker.js';
import AdaptationLog from '../../models/AdaptationLog.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';

/**
 * Perform adaptive analysis and apply adjustments
 * @param {string} userId - User ID
 * @returns {Object} Adaptation results
 */
export async function performAdaptiveAnalysis(userId) {
  try {
    // Get progress data
    const [weightTrend, calorieMetrics, workoutMetrics] = await Promise.all([
      progressTracker.calculateWeightTrend(userId, 'weekly'),
      progressTracker.calculateCalorieMetrics(userId),
      progressTracker.getWorkoutMetrics(userId)
    ]);

    // Analyze and get recommendations
    const adaptationResult = await analyzeProgressAndAdapt(userId, {
      weightTrend,
      calorieMetrics,
      workoutMetrics
    });

    // If adaptations are recommended, log them
    if (adaptationResult.adaptations && adaptationResult.adaptations.length > 0) {
      for (const adaptation of adaptationResult.adaptations) {
        await AdaptationLog.create({
          userId,
          date: new Date(),
          trigger: adaptation.trigger,
          changes: adaptation.changes,
          reasoning: adaptation.reasoning,
          effectiveDate: new Date()
        });
      }

      logger.info('Adaptive adjustments applied', {
        userId,
        adaptationCount: adaptationResult.adaptations.length
      });
    }

    return adaptationResult;
  } catch (error) {
    logger.error('Failed to perform adaptive analysis', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Check if user needs adaptive analysis
 * @param {string} userId - User ID
 * @returns {boolean} Whether analysis is needed
 */
export async function needsAdaptiveAnalysis(userId) {
  try {
    // Check last adaptation log
    const lastAdaptation = await AdaptationLog.findOne({ userId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!lastAdaptation) {
      return true; // Never analyzed before
    }

    // Run analysis weekly
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastAdaptation.createdAt < oneWeekAgo;
  } catch (error) {
    logger.error('Failed to check adaptive analysis need', {
      userId,
      error: error.message
    });
    return false;
  }
}
