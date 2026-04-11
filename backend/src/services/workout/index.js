/**
 * Workout Service Module
 * Exports all workout-related functions for the SmartGain backend
 */

import {
  generateWeeklyPlan,
  getExercise,
  getAllExercises,
  getExercisesByCategory,
  getExercisesByMuscle,
  getSessionForDay,
  getWorkoutStats,
  validateWorkoutRequest,
  applyProgressiveOverload,
  getStartingRecommendation,
  EXERCISE_DATABASE,
  BEGINNER_TEMPLATE,
  INTERMEDIATE_TEMPLATE,
  ADVANCED_TEMPLATE,
  PROGRESSIVE_OVERLOAD_CONFIG
} from './workoutEngine.js';

export {
  // Workout Planning
  generateWeeklyPlan,
  getSessionForDay,
  getWorkoutStats,
  
  // Exercise Lookup
  getExercise,
  getAllExercises,
  getExercisesByCategory,
  getExercisesByMuscle,
  
  // Progressive Overload
  applyProgressiveOverload,
  getStartingRecommendation,
  
  // Validation
  validateWorkoutRequest,
  
  // Data
  EXERCISE_DATABASE,
  BEGINNER_TEMPLATE,
  INTERMEDIATE_TEMPLATE,
  ADVANCED_TEMPLATE,
  PROGRESSIVE_OVERLOAD_CONFIG
};
