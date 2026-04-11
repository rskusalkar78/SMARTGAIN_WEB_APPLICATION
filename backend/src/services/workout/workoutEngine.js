/**
 * Workout Engine Service - Weekly Exercise Plans
 * Generates customized workout plans based on fitness level and experience
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

import Joi from 'joi';
import { ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/**
 * Exercise database with descriptions and form guidance
 */
const EXERCISE_DATABASE = {
  // Upper Body - Chest
  'push-ups': {
    name: 'Push-ups',
    category: 'chest',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    difficulty: 'beginner',
    description: 'Standard bodyweight push-up exercise',
    formGuidance: 'Keep body straight, lower chest to ground, push back up. Elbows at 45 degrees.',
    sets: 3,
    reps: 10,
    rest: 60,
    equipment: 'none'
  },
  'bench-press': {
    name: 'Barbell Bench Press',
    category: 'chest',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    difficulty: 'intermediate',
    description: 'Compound chest exercise with barbell',
    formGuidance: 'Lie on bench, lower bar to chest, press back up. Full range of motion.',
    sets: 4,
    reps: 8,
    rest: 120,
    equipment: 'barbell'
  },
  'dumbbell-press': {
    name: 'Dumbbell Bench Press',
    category: 'chest',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    difficulty: 'intermediate',
    description: 'Dumbbell variation of bench press',
    formGuidance: 'Press dumbbells up from chest level, control descent.',
    sets: 4,
    reps: 10,
    rest: 90,
    equipment: 'dumbbells'
  },

  // Upper Body - Back
  'pull-ups': {
    name: 'Pull-ups',
    category: 'back',
    targetMuscles: ['back', 'biceps', 'shoulders'],
    difficulty: 'beginner',
    description: 'Bodyweight back exercise',
    formGuidance: 'Full range of motion from dead hang to chest at bar. Use assistance if needed.',
    sets: 3,
    reps: 5,
    rest: 90,
    equipment: 'pull-up bar'
  },
  'barbell-rows': {
    name: 'Barbell Rows',
    category: 'back',
    targetMuscles: ['back', 'biceps', 'lats'],
    difficulty: 'intermediate',
    description: 'Heavy compound back exercise',
    formGuidance: 'Bend at hips, keep back straight, row bar to chest. Explosive pull.',
    sets: 4,
    reps: 8,
    rest: 120,
    equipment: 'barbell'
  },
  'lat-pulldown': {
    name: 'Lat Pulldown',
    category: 'back',
    targetMuscles: ['lats', 'biceps'],
    difficulty: 'beginner',
    description: 'Machine-based lat exercise',
    formGuidance: 'Pull bar down to chest, control the negative. Vertical pulling motion.',
    sets: 3,
    reps: 10,
    rest: 60,
    equipment: 'machine'
  },

  // Upper Body - Shoulders
  'overhead-press': {
    name: 'Overhead Press',
    category: 'shoulders',
    targetMuscles: ['shoulders', 'triceps'],
    difficulty: 'intermediate',
    description: 'Standing shoulder press with barbell',
    formGuidance: 'Press bar from shoulders overhead, maintain core tension.',
    sets: 4,
    reps: 8,
    rest: 120,
    equipment: 'barbell'
  },
  'dumbbell-lateral-raise': {
    name: 'Dumbbell Lateral Raise',
    category: 'shoulders',
    targetMuscles: ['shoulders'],
    difficulty: 'beginner',
    description: 'Isolation shoulder exercise',
    formGuidance: 'Raise dumbbells to shoulder height, slight bend in elbows, controlled descent.',
    sets: 3,
    reps: 12,
    rest: 45,
    equipment: 'dumbbells'
  },

  // Upper Body - Arms
  'barbell-curl': {
    name: 'Barbell Curl',
    category: 'biceps',
    targetMuscles: ['biceps'],
    difficulty: 'beginner',
    description: 'Bicep isolation exercise',
    formGuidance: 'Keep elbows stationary, curl bar to shoulder height, lower with control.',
    sets: 3,
    reps: 10,
    rest: 60,
    equipment: 'barbell'
  },
  'tricep-dips': {
    name: 'Tricep Dips',
    category: 'triceps',
    targetMuscles: ['triceps'],
    difficulty: 'intermediate',
    description: 'Bodyweight tricep exercise',
    formGuidance: 'Lower body until 90 degree angle, press back up. Use assistance if needed.',
    sets: 3,
    reps: 8,
    rest: 90,
    equipment: 'dip bar'
  },

  // Lower Body - Quadriceps
  'squats': {
    name: 'Barbell Squats',
    category: 'quadriceps',
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    difficulty: 'intermediate',
    description: 'King of lower body exercises',
    formGuidance: 'Back straight, descend until thighs parallel to ground, drive through heels.',
    sets: 4,
    reps: 8,
    rest: 150,
    equipment: 'barbell'
  },
  'leg-press': {
    name: 'Leg Press',
    category: 'quadriceps',
    targetMuscles: ['quadriceps', 'glutes'],
    difficulty: 'beginner',
    description: 'Machine-based leg exercise',
    formGuidance: 'Full range of motion, knees align with toes, controlled descent.',
    sets: 3,
    reps: 10,
    rest: 90,
    equipment: 'machine'
  },
  'leg-extensions': {
    name: 'Leg Extensions',
    category: 'quadriceps',
    targetMuscles: ['quadriceps'],
    difficulty: 'beginner',
    description: 'Isolation quadricep exercise',
    formGuidance: 'Extend legs fully at the top, squeeze quads, control the descent.',
    sets: 3,
    reps: 12,
    rest: 60,
    equipment: 'machine'
  },

  // Lower Body - Hamstrings/Glutes
  'deadlifts': {
    name: 'Deadlifts',
    category: 'hamstrings',
    targetMuscles: ['hamstrings', 'glutes', 'back'],
    difficulty: 'advanced',
    description: 'Heavy compound posterior chain exercise',
    formGuidance: 'Straight back, hips back, drive through heels. Explosive movement.',
    sets: 3,
    reps: 6,
    rest: 180,
    equipment: 'barbell'
  },
  'leg-curls': {
    name: 'Leg Curls',
    category: 'hamstrings',
    targetMuscles: ['hamstrings'],
    difficulty: 'beginner',
    description: 'Isolation hamstring exercise',
    formGuidance: 'Curl legs up, squeeze at top, control descent. Full range of motion.',
    sets: 3,
    reps: 12,
    rest: 60,
    equipment: 'machine'
  },
  'romanian-deadlifts': {
    name: 'Romanian Deadlifts',
    category: 'hamstrings',
    targetMuscles: ['hamstrings', 'glutes', 'back'],
    difficulty: 'intermediate',
    description: 'Hip hinge posterior chain exercise',
    formGuidance: 'Slight bend in knees, hinge at hips, feel hamstring stretch.',
    sets: 3,
    reps: 8,
    rest: 120,
    equipment: 'barbell'
  },

  // Core
  'planks': {
    name: 'Planks',
    category: 'core',
    targetMuscles: ['core', 'shoulders'],
    difficulty: 'beginner',
    description: 'Core stability exercise',
    formGuidance: 'Keep body straight, engage core, don\'t let hips sag. Hold steady.',
    sets: 3,
    reps: 30,
    rest: 60,
    equipment: 'none'
  },
  'cable-crunches': {
    name: 'Cable Crunches',
    category: 'core',
    targetMuscles: ['abs'],
    difficulty: 'beginner',
    description: 'Weighted ab isolation exercise',
    formGuidance: 'Crunch forward, squeeze abs at bottom, control descent. Rope attachment.',
    sets: 3,
    reps: 12,
    rest: 60,
    equipment: 'cable machine'
  },
};

/**
 * Beginner workout template - 3 days per week
 */
const BEGINNER_TEMPLATE = {
  name: 'Beginner Full Body',
  frequency: 3,
  sessions: [
    {
      day: 1,
      name: 'Full Body A',
      exercises: [
        'push-ups',
        'barbell-rows',
        'leg-press',
        'planks'
      ]
    },
    {
      day: 3,
      name: 'Full Body B',
      exercises: [
        'lat-pulldown',
        'dumbbell-press',
        'leg-extensions',
        'dumbbell-lateral-raise'
      ]
    },
    {
      day: 5,
      name: 'Full Body C',
      exercises: [
        'pull-ups',
        'barbell-curl',
        'leg-curls',
        'cable-crunches'
      ]
    }
  ]
};

/**
 * Intermediate workout template - 4 days per week (Upper/Lower split)
 */
const INTERMEDIATE_TEMPLATE = {
  name: 'Upper/Lower Split',
  frequency: 4,
  sessions: [
    {
      day: 1,
      name: 'Upper Power',
      exercises: [
        'bench-press',
        'barbell-rows',
        'overhead-press',
        'barbell-curl'
      ]
    },
    {
      day: 2,
      name: 'Lower Power',
      exercises: [
        'squats',
        'romanian-deadlifts',
        'leg-press',
        'cable-crunches'
      ]
    },
    {
      day: 4,
      name: 'Upper Hypertrophy',
      exercises: [
        'dumbbell-press',
        'lat-pulldown',
        'dumbbell-lateral-raise',
        'tricep-dips'
      ]
    },
    {
      day: 5,
      name: 'Lower Hypertrophy',
      exercises: [
        'leg-extensions',
        'leg-curls',
        'dumbbell-lateral-raise',
        'planks'
      ]
    }
  ]
};

/**
 * Advanced workout template - 5 days per week (Push/Pull/Legs)
 */
const ADVANCED_TEMPLATE = {
  name: 'Push/Pull/Legs',
  frequency: 5,
  sessions: [
    {
      day: 1,
      name: 'Push (Chest/Shoulders/Triceps)',
      exercises: [
        'bench-press',
        'overhead-press',
        'dumbbell-press',
        'dumbbell-lateral-raise',
        'tricep-dips'
      ]
    },
    {
      day: 2,
      name: 'Pull (Back/Biceps)',
      exercises: [
        'deadlifts',
        'barbell-rows',
        'pull-ups',
        'lat-pulldown',
        'barbell-curl'
      ]
    },
    {
      day: 3,
      name: 'Legs',
      exercises: [
        'squats',
        'romanian-deadlifts',
        'leg-extensions',
        'leg-curls',
        'cable-crunches'
      ]
    },
    {
      day: 4,
      name: 'Push (Accessory)',
      exercises: [
        'dumbbell-press',
        'dumbbell-lateral-raise',
        'barbell-curl',
        'tricep-dips',
        'planks'
      ]
    },
    {
      day: 5,
      name: 'Pull (Accessory)',
      exercises: [
        'lat-pulldown',
        'barbell-rows',
        'pull-ups',
        'cable-crunches'
      ]
    }
  ]
};

/**
 * Validates workout plan request parameters
 * @param {Object} data - Input data with fitnessLevel
 * @throws {ValidationError} If validation fails
 */
function validateWorkoutRequest(data) {
  const schema = Joi.object({
    fitnessLevel: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .required()
      .messages({
        'any.only': 'Fitness level must be one of: beginner, intermediate, advanced',
        'any.required': 'Fitness level is required'
      })
  });

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new ValidationError(
      `Workout request validation failed: ${messages.join(', ')}`
    );
  }

  return value;
}

/**
 * Generates a weekly workout plan based on fitness level
 * @param {string} fitnessLevel - User's fitness level (beginner, intermediate, advanced)
 * @returns {Object} Complete weekly workout plan with exercises
 */
function generateWeeklyPlan(fitnessLevel) {
  try {
    validateWorkoutRequest({ fitnessLevel });

    let template;
    switch (fitnessLevel) {
      case 'beginner':
        template = BEGINNER_TEMPLATE;
        break;
      case 'intermediate':
        template = INTERMEDIATE_TEMPLATE;
        break;
      case 'advanced':
        template = ADVANCED_TEMPLATE;
        break;
    }

    // Build detailed workout plan with exercise information
    const weeklyPlan = {
      name: template.name,
      fitnessLevel,
      sessionsPerWeek: template.frequency,
      sessions: template.sessions.map(session => ({
        ...session,
        exercises: session.exercises.map(exerciseKey => ({
          key: exerciseKey,
          ...EXERCISE_DATABASE[exerciseKey]
        }))
      })),
      totalExercises: template.sessions.reduce((sum, s) => sum + s.exercises.length, 0)
    };

    logger.debug('Weekly workout plan generated', {
      fitnessLevel,
      sessionsPerWeek: template.frequency
    });

    return weeklyPlan;
  } catch (error) {
    logger.error('Workout plan generation failed', {
      error: error.message,
      fitnessLevel
    });
    throw error;
  }
}

/**
 * Gets a specific exercise details
 * @param {string} exerciseKey - The exercise identifier
 * @returns {Object} Complete exercise information
 * @throws {ValidationError} If exercise not found
 */
function getExercise(exerciseKey) {
  const exercise = EXERCISE_DATABASE[exerciseKey];
  if (!exercise) {
    throw new ValidationError(
      `Exercise not found: "${exerciseKey}". Check the exercise database for available options.`
    );
  }

  return {
    key: exerciseKey,
    ...exercise
  };
}

/**
 * Gets all available exercises
 * @returns {Array} List of all exercises
 */
function getAllExercises() {
  const exercises = [];
  for (const [key, exercise] of Object.entries(EXERCISE_DATABASE)) {
    exercises.push({
      key,
      ...exercise
    });
  }
  return exercises;
}

/**
 * Gets exercises by category
 * @param {string} category - Exercise category (chest, back, shoulders, etc.)
 * @returns {Array} Exercises in the category
 */
function getExercisesByCategory(category) {
  return getAllExercises().filter(ex => ex.category === category);
}

/**
 * Gets exercises by target muscle
 * @param {string} muscle - Target muscle name
 * @returns {Array} Exercises targeting the muscle
 */
function getExercisesByMuscle(muscle) {
  return getAllExercises().filter(ex => 
    ex.targetMuscles.includes(muscle)
  );
}

/**
 * Gets session details for a specific day
 * @param {string} fitnessLevel - Fitness level
 * @param {number} day - Day of week (1-7)
 * @returns {Object} Session details or null if no session on that day
 */
function getSessionForDay(fitnessLevel, day) {
  try {
    validateWorkoutRequest({ fitnessLevel });

    if (day < 1 || day > 7) {
      throw new ValidationError('Day must be between 1 and 7');
    }

    const weeklyPlan = generateWeeklyPlan(fitnessLevel);
    const session = weeklyPlan.sessions.find(s => s.day === day);

    if (!session) {
      return {
        day,
        name: 'Rest Day',
        exercises: [],
        isRestDay: true
      };
    }

    return {
      ...session,
      isRestDay: false
    };
  } catch (error) {
    logger.error('Get session for day failed', {
      error: error.message,
      fitnessLevel,
      day
    });
    throw error;
  }
}

/**
 * Gets database statistics
 * @returns {Object} Statistics about exercises
 */
function getWorkoutStats() {
  const exercises = getAllExercises();
  const categories = {};
  const muscles = {};

  exercises.forEach(ex => {
    categories[ex.category] = (categories[ex.category] || 0) + 1;
    ex.targetMuscles.forEach(muscle => {
      muscles[muscle] = (muscles[muscle] || 0) + 1;
    });
  });

  return {
    totalExercises: exercises.length,
    categories,
    targetMuscles: muscles
  };
}
/**
 * Progressive overload configuration by fitness level
 */
const PROGRESSIVE_OVERLOAD_CONFIG = {
  beginner: {
    weightIncrease: 2.5, // kg per week
    repIncrease: 2, // reps per week if weight can't increase
    minWeeksBeforeIncrease: 1,
    maxWeeksBeforeIncrease: 2
  },
  intermediate: {
    weightIncrease: 1.25, // kg per week
    repIncrease: 1,
    minWeeksBeforeIncrease: 1,
    maxWeeksBeforeIncrease: 3
  },
  advanced: {
    weightIncrease: 0.5, // kg per week
    repIncrease: 1,
    minWeeksBeforeIncrease: 2,
    maxWeeksBeforeIncrease: 4
  }
};

/**
 * Applies progressive overload to a workout based on performance
 * @param {string} fitnessLevel - User's fitness level
 * @param {Object} currentWorkout - Current workout data with sets/reps/weight
 * @param {Object} performanceData - Performance metrics (completed sets, reps, etc.)
 * @returns {Object} Updated workout with progressive overload applied
 */
function applyProgressiveOverload(fitnessLevel, currentWorkout, performanceData) {
  try {
    validateWorkoutRequest({ fitnessLevel });

    if (!currentWorkout || !performanceData) {
      throw new ValidationError('Current workout and performance data are required');
    }

    const config = PROGRESSIVE_OVERLOAD_CONFIG[fitnessLevel];
    const { exerciseKey, currentWeight, currentReps, currentSets, weeksAtCurrent } = currentWorkout;
    const { completedAllSets, completedAllReps, formQuality } = performanceData;

    // Get exercise details
    const exercise = getExercise(exerciseKey);

    // Determine if ready for progression
    const readyForProgression =
      completedAllSets &&
      completedAllReps &&
      formQuality >= 7 && // Form quality on 1-10 scale
      weeksAtCurrent >= config.minWeeksBeforeIncrease;

    if (!readyForProgression) {
      logger.debug('Not ready for progressive overload', {
        exerciseKey,
        completedAllSets,
        completedAllReps,
        formQuality,
        weeksAtCurrent
      });

      return {
        exerciseKey,
        weight: currentWeight,
        reps: currentReps,
        sets: currentSets,
        progressionApplied: false,
        reason: 'Performance criteria not met'
      };
    }

    // Apply weight increase if possible
    let newWeight = currentWeight;
    let newReps = currentReps;
    let progressionType = 'none';

    // For weighted exercises, increase weight
    if (exercise.equipment !== 'none' && currentWeight > 0) {
      newWeight = currentWeight + config.weightIncrease;
      progressionType = 'weight';
    }
    // For bodyweight exercises or if weight can't increase, increase reps
    else {
      newReps = currentReps + config.repIncrease;
      progressionType = 'reps';
    }

    logger.info('Progressive overload applied', {
      exerciseKey,
      fitnessLevel,
      progressionType,
      oldWeight: currentWeight,
      newWeight,
      oldReps: currentReps,
      newReps
    });

    return {
      exerciseKey,
      weight: newWeight,
      reps: newReps,
      sets: currentSets,
      progressionApplied: true,
      progressionType,
      weeksAtCurrent: 0 // Reset counter
    };
  } catch (error) {
    logger.error('Progressive overload application failed', {
      error: error.message,
      fitnessLevel
    });
    throw error;
  }
}

/**
 * Calculates recommended starting weights for exercises
 * @param {string} fitnessLevel - User's fitness level
 * @param {string} exerciseKey - Exercise identifier
 * @returns {Object} Recommended starting weight and reps
 */
function getStartingRecommendation(fitnessLevel, exerciseKey) {
  try {
    validateWorkoutRequest({ fitnessLevel });
    const exercise = getExercise(exerciseKey);

    // Base recommendations by fitness level
    const recommendations = {
      beginner: {
        weightMultiplier: 0.5, // 50% of typical working weight
        repsAdjustment: 2 // Add 2 reps to base
      },
      intermediate: {
        weightMultiplier: 0.7,
        repsAdjustment: 0
      },
      advanced: {
        weightMultiplier: 0.85,
        repsAdjustment: -2 // Reduce 2 reps for heavier weight
      }
    };

    const rec = recommendations[fitnessLevel];

    // For bodyweight exercises
    if (exercise.equipment === 'none') {
      return {
        exerciseKey,
        weight: 0,
        reps: exercise.reps + rec.repsAdjustment,
        sets: exercise.sets,
        notes: 'Bodyweight exercise - focus on form and full range of motion'
      };
    }

    // For weighted exercises - provide guidance
    return {
      exerciseKey,
      weight: 'user-determined', // User needs to test their working weight
      reps: exercise.reps + rec.repsAdjustment,
      sets: exercise.sets,
      notes: `Start with ${rec.weightMultiplier * 100}% of your estimated max. Focus on proper form.`
    };
  } catch (error) {
    logger.error('Starting recommendation calculation failed', {
      error: error.message,
      fitnessLevel,
      exerciseKey
    });
    throw error;
  }
}

export {
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
};
