import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { BodyStats, CalorieLog, WorkoutLog, AdaptationLog, User } from '../../models/index.js';

describe('Data Models', () => {
  let testUserId;

  beforeEach(async () => {
    // Create a test user for model relationships
    const testUser = new User({
      email: 'test@example.com',
      password: 'TestPass123',
      profile: {
        name: 'Test User',
        age: 25,
        gender: 'male',
        height: 175,
        currentWeight: 70,
        targetWeight: 80,
        activityLevel: 'moderate',
        fitnessLevel: 'intermediate',
        dietaryPreferences: ['non-vegetarian']
      },
      goals: {
        weeklyWeightGain: 0.5,
        goalIntensity: 'moderate'
      }
    });
    
    const savedUser = await testUser.save();
    testUserId = savedUser._id;
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await BodyStats.deleteMany({});
    await CalorieLog.deleteMany({});
    await WorkoutLog.deleteMany({});
    await AdaptationLog.deleteMany({});
  });

  describe('BodyStats Model', () => {
    it('should create a valid body stats entry', async () => {
      const bodyStats = new BodyStats({
        userId: testUserId,
        weight: 72.5,
        bodyFat: 15.2,
        measurements: {
          chest: 95,
          waist: 80,
          arms: 35,
          thighs: 55
        },
        notes: 'Feeling good today'
      });

      const saved = await bodyStats.save();
      expect(saved._id).toBeDefined();
      expect(saved.weight).toBe(72.5);
      expect(saved.bodyFat).toBe(15.2);
      expect(saved.measurements.chest).toBe(95);
    });

    it('should require userId and weight', async () => {
      const bodyStats = new BodyStats({
        bodyFat: 15.2
      });

      await expect(bodyStats.save()).rejects.toThrow();
    });

    it('should validate weight range', async () => {
      const bodyStats = new BodyStats({
        userId: testUserId,
        weight: 25 // Below minimum
      });

      await expect(bodyStats.save()).rejects.toThrow();
    });
  });

  describe('CalorieLog Model', () => {
    it('should create a valid calorie log entry', async () => {
      const calorieLog = new CalorieLog({
        userId: testUserId,
        meals: [{
          name: 'breakfast',
          foods: [{
            item: 'eggs',
            quantity: 100,
            calories: 150,
            protein: 12,
            carbs: 1,
            fat: 11
          }],
          totalCalories: 150,
          totalProtein: 12,
          totalCarbs: 1,
          totalFat: 11
        }],
        dailyTotals: {
          calories: 150,
          protein: 12,
          carbs: 1,
          fat: 11
        },
        targetMet: false
      });

      const saved = await calorieLog.save();
      expect(saved._id).toBeDefined();
      expect(saved.meals).toHaveLength(1);
      expect(saved.meals[0].name).toBe('breakfast');
      expect(saved.dailyTotals.calories).toBe(150);
    });

    it('should validate meal names', async () => {
      const calorieLog = new CalorieLog({
        userId: testUserId,
        meals: [{
          name: 'invalid-meal', // Invalid meal name
          foods: [{
            item: 'eggs',
            quantity: 100,
            calories: 150,
            protein: 12,
            carbs: 1,
            fat: 11
          }],
          totalCalories: 150,
          totalProtein: 12,
          totalCarbs: 1,
          totalFat: 11
        }],
        dailyTotals: {
          calories: 150,
          protein: 12,
          carbs: 1,
          fat: 11
        }
      });

      await expect(calorieLog.save()).rejects.toThrow();
    });
  });

  describe('WorkoutLog Model', () => {
    it('should create a valid workout log entry', async () => {
      const workoutLog = new WorkoutLog({
        userId: testUserId,
        workoutPlan: 'upper-lower',
        exercises: [{
          name: 'Bench Press',
          category: 'compound',
          muscleGroups: ['chest', 'triceps'],
          sets: [{
            reps: 10,
            weight: 80,
            restTime: 120,
            completed: true
          }],
          totalVolume: 800,
          personalRecord: false
        }],
        duration: 60,
        intensity: 'moderate',
        notes: 'Good workout'
      });

      const saved = await workoutLog.save();
      expect(saved._id).toBeDefined();
      expect(saved.exercises).toHaveLength(1);
      expect(saved.exercises[0].name).toBe('Bench Press');
      expect(saved.exercises[0].totalVolume).toBe(800);
    });

    it('should validate workout plan types', async () => {
      const workoutLog = new WorkoutLog({
        userId: testUserId,
        workoutPlan: 'invalid-plan', // Invalid plan
        exercises: [{
          name: 'Bench Press',
          category: 'compound',
          muscleGroups: ['chest'],
          sets: [{
            reps: 10,
            weight: 80,
            completed: true
          }],
          totalVolume: 800
        }],
        duration: 60,
        intensity: 'moderate'
      });

      await expect(workoutLog.save()).rejects.toThrow();
    });
  });

  describe('AdaptationLog Model', () => {
    it('should create a valid adaptation log entry', async () => {
      const adaptationLog = new AdaptationLog({
        userId: testUserId,
        trigger: 'weight_stagnation',
        changes: {
          calorieAdjustment: 150,
          macroAdjustments: {
            protein: 10,
            carbs: 20,
            fat: 5
          },
          workoutAdjustments: {
            volumeChange: 10,
            intensityChange: 'increase',
            restDaysAdded: 0
          }
        },
        reasoning: 'User weight has not increased for 2 weeks, increasing calories',
        effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const saved = await adaptationLog.save();
      expect(saved._id).toBeDefined();
      expect(saved.trigger).toBe('weight_stagnation');
      expect(saved.changes.calorieAdjustment).toBe(150);
      expect(saved.applied).toBe(false);
    });

    it('should validate trigger types', async () => {
      const adaptationLog = new AdaptationLog({
        userId: testUserId,
        trigger: 'invalid-trigger', // Invalid trigger
        changes: {
          calorieAdjustment: 150
        },
        reasoning: 'Test reasoning'
      });

      await expect(adaptationLog.save()).rejects.toThrow();
    });

    it('should validate calorie adjustment range', async () => {
      const adaptationLog = new AdaptationLog({
        userId: testUserId,
        trigger: 'weight_stagnation',
        changes: {
          calorieAdjustment: 600 // Exceeds maximum
        },
        reasoning: 'Test reasoning'
      });

      await expect(adaptationLog.save()).rejects.toThrow();
    });
  });

  describe('Model Relationships', () => {
    it('should maintain proper user references', async () => {
      const bodyStats = new BodyStats({
        userId: testUserId,
        weight: 72.5
      });

      const saved = await bodyStats.save();
      const populated = await BodyStats.findById(saved._id).populate('userId');
      
      expect(populated.userId.email).toBe('test@example.com');
    });
  });

  describe('Model Static Methods', () => {
    it('should get latest body stats for user', async () => {
      // Create multiple body stats entries
      await BodyStats.create({
        userId: testUserId,
        weight: 70,
        date: new Date('2024-01-01')
      });

      await BodyStats.create({
        userId: testUserId,
        weight: 72,
        date: new Date('2024-01-02')
      });

      const latest = await BodyStats.getLatestForUser(testUserId);
      expect(latest.weight).toBe(72);
    });

    it('should calculate workout frequency', async () => {
      // Create workout logs
      await WorkoutLog.create({
        userId: testUserId,
        workoutPlan: 'full-body',
        exercises: [{
          name: 'Squat',
          category: 'compound',
          muscleGroups: ['quads'],
          sets: [{ reps: 10, weight: 100, completed: true }],
          totalVolume: 1000
        }],
        duration: 45,
        intensity: 'moderate',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      });

      const frequency = await WorkoutLog.getWorkoutFrequency(testUserId, 7);
      expect(frequency.totalWorkouts).toBe(1);
      expect(frequency.days).toBe(7);
    });
  });
});