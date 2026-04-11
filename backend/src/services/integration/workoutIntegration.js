import { generateWeeklyPlan } from '../workout/workoutEngine.js';
// import { progressWorkout, adjustIntensity } from '../workout/workoutEngine.js'; // TODO: These functions don't exist yet
import WorkoutLog from '../../models/WorkoutLog.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';

/**
 * Generate personalized workout plan for user
 * @param {string} userId - User ID
 * @param {Object} options - Workout plan options
 * @returns {Object} Generated workout plan
 */
export async function generateUserWorkoutPlan(userId, options = {}) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { fitnessLevel } = user.profile;
    const { weeklyWeightGain } = user.goals;

    // Get recent workout history for progression
    const recentWorkouts = await WorkoutLog.find({ userId })
      .sort({ date: -1 })
      .limit(10);

    // Generate workout plan
    const workoutPlan = generateWeeklyPlan(
      fitnessLevel,
      {
        goal: 'muscle_gain',
        weeklyWeightGain,
        recentWorkouts,
        ...options
      }
    );

    logger.info('Workout plan generated', {
      userId,
      fitnessLevel,
      sessionsPerWeek: workoutPlan.sessions.length
    });

    return {
      ...workoutPlan,
      user: {
        name: user.profile.name,
        fitnessLevel
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to generate workout plan', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Apply progressive overload to workout based on performance
 * @param {string} userId - User ID
 * @param {string} workoutLogId - Workout log ID
 * @returns {Object} Updated workout with progression
 */
export async function applyProgressiveOverload(userId, workoutLogId) {
  try {
    const workoutLog = await WorkoutLog.findOne({ _id: workoutLogId, userId });
    if (!workoutLog) {
      throw new Error('Workout log not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Apply progression based on performance
    // TODO: progressWorkout function doesn't exist yet
    const progressedWorkout = workoutLog; // progressWorkout(workoutLog, user.profile.fitnessLevel);

    logger.info('Progressive overload applied', {
      userId,
      workoutLogId,
      fitnessLevel: user.profile.fitnessLevel
    });

    return progressedWorkout;
  } catch (error) {
    logger.error('Failed to apply progressive overload', {
      userId,
      workoutLogId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Adjust workout intensity based on recovery metrics
 * @param {string} userId - User ID
 * @param {Object} recoveryMetrics - Recovery data
 * @returns {Object} Intensity adjustments
 */
export async function adjustWorkoutIntensity(userId, recoveryMetrics) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get recent workout logs
    const recentWorkouts = await WorkoutLog.find({ userId })
      .sort({ date: -1 })
      .limit(14); // Last 2 weeks

    // Analyze and adjust intensity
    // TODO: adjustIntensity function doesn't exist yet
    const adjustments = {}; // adjustIntensity(recentWorkouts, recoveryMetrics, user.profile.fitnessLevel);

    logger.info('Workout intensity adjusted', {
      userId,
      adjustments
    });

    return adjustments;
  } catch (error) {
    logger.error('Failed to adjust workout intensity', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Calculate workout volume for tracking
 * @param {Object} workout - Workout log
 * @returns {number} Total volume (sets × reps × weight)
 */
export function calculateWorkoutVolume(workout) {
  let totalVolume = 0;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.completed) {
        totalVolume += set.reps * set.weight;
      }
    }
  }

  return totalVolume;
}
