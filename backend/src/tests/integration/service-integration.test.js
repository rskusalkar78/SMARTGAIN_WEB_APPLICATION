import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import { recalculateUserMetrics } from '../../services/integration/calculationIntegration.js';
import { generateUserMealPlan } from '../../services/integration/nutritionIntegration.js';
import { generateUserWorkoutPlan } from '../../services/integration/workoutIntegration.js';
import database from '../../config/database.js';

describe('Service Integration Tests', () => {
  let testUserId;

  beforeAll(async () => {
    // Connect to test database
    await database.connect();

    // Create a test user
    const testUser = new User({
      email: 'integration-test@example.com',
      password: 'TestPass123',
      profile: {
        name: 'Integration Test User',
        age: 25,
        gender: 'male',
        height: 175,
        currentWeight: 70,
        targetWeight: 80,
        activityLevel: 'moderate',
        fitnessLevel: 'intermediate',
        dietaryPreferences: ['vegetarian']
      },
      goals: {
        weeklyWeightGain: 0.5,
        goalIntensity: 'moderate'
      }
    });

    await testUser.save();
    testUserId = testUser._id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
    }
    await database.disconnect();
  });

  describe('Calculation Integration', () => {
    it('should recalculate user metrics when profile is updated', async () => {
      const user = await User.findById(testUserId);
      
      // Recalculate metrics
      const calculations = await recalculateUserMetrics(user);
      
      expect(calculations).toBeDefined();
      expect(calculations.bmr).toBeGreaterThan(0);
      expect(calculations.tdee).toBeGreaterThan(calculations.bmr);
      expect(calculations.targetCalories).toBeGreaterThan(calculations.tdee);
      expect(calculations.macroTargets).toBeDefined();
      expect(calculations.macroTargets.protein).toBeGreaterThan(0);
      expect(calculations.macroTargets.carbs).toBeGreaterThan(0);
      expect(calculations.macroTargets.fat).toBeGreaterThan(0);
    });
  });

  describe('Nutrition Integration', () => {
    it('should generate meal plan for user', async () => {
      // First ensure user has calculations
      const user = await User.findById(testUserId);
      await recalculateUserMetrics(user);
      await user.save();
      
      // Generate meal plan
      const mealPlan = await generateUserMealPlan(testUserId);
      
      expect(mealPlan).toBeDefined();
      expect(mealPlan.meals).toBeDefined();
      expect(Array.isArray(mealPlan.meals)).toBe(true);
      expect(mealPlan.user).toBeDefined();
      expect(mealPlan.user.dietaryPreferences).toContain('vegetarian');
    });
  });

  describe('Workout Integration', () => {
    it('should generate workout plan for user', async () => {
      const workoutPlan = await generateUserWorkoutPlan(testUserId);
      
      expect(workoutPlan).toBeDefined();
      expect(workoutPlan.sessions).toBeDefined();
      expect(Array.isArray(workoutPlan.sessions)).toBe(true);
      expect(workoutPlan.sessions.length).toBeGreaterThan(0);
      expect(workoutPlan.user).toBeDefined();
      expect(workoutPlan.user.fitnessLevel).toBe('intermediate');
    });
  });
});
