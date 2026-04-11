import User from '../models/User.js';
import WorkoutLog from '../models/WorkoutLog.js';
import { generateUserWorkoutPlan, calculateWorkoutVolume } from '../services/integration/workoutIntegration.js';
import logger from '../utils/logger.js';

class WorkoutController {
  /**
   * Get current workout plan for user
   * GET /api/v1/workout/current-plan
   */
  async getCurrentPlan(req, res) {
    try {
      const userId = req.userId;
      
      // Generate workout plan using integration
      const workoutPlan = await generateUserWorkoutPlan(userId);
      
      res.status(200).json({
        success: true,
        data: workoutPlan,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      let statusCode = 500;
      let errorCode = 'WORKOUT_PLAN_GENERATION_FAILED';
      
      if (error.message === 'User not found') {
        statusCode = 404;
        errorCode = 'USER_NOT_FOUND';
      }
      
      res.status(statusCode).json({
        error: {
          code: errorCode,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Log workout session
   * POST /api/v1/workout/log
   */
  async logWorkout(req, res) {
    try {
      const userId = req.userId;
      const { date, workoutPlan, exercises, duration, intensity, notes } = req.body;
      
      // Validate required fields
      if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Exercises array is required and must not be empty',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Calculate total volume for each exercise
      const exercisesWithVolume = exercises.map(exercise => {
        const totalVolume = exercise.sets.reduce((sum, set) => {
          if (set.completed) {
            return sum + (set.reps * set.weight);
          }
          return sum;
        }, 0);
        
        return {
          ...exercise,
          totalVolume
        };
      });
      
      // Create workout log entry
      const workoutLog = new WorkoutLog({
        userId,
        date: date ? new Date(date) : new Date(),
        workoutPlan: workoutPlan || 'custom',
        exercises: exercisesWithVolume,
        duration: duration || 0,
        intensity: intensity || 'moderate',
        notes: notes || ''
      });
      
      await workoutLog.save();
      
      logger.info('Workout logged', {
        userId,
        date: workoutLog.date,
        workoutPlan: workoutLog.workoutPlan,
        exerciseCount: exercises.length,
        duration
      });
      
      res.status(201).json({
        success: true,
        message: 'Workout logged successfully',
        data: {
          workoutLog: {
            id: workoutLog._id,
            date: workoutLog.date,
            workoutPlan: workoutLog.workoutPlan,
            exercises: workoutLog.exercises,
            duration: workoutLog.duration,
            intensity: workoutLog.intensity
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log workout', {
        userId: req.userId,
        error: error.message
      });
      
      let statusCode = 500;
      let errorCode = 'WORKOUT_LOG_FAILED';
      
      if (error.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      }
      
      res.status(statusCode).json({
        error: {
          code: errorCode,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export default new WorkoutController();
