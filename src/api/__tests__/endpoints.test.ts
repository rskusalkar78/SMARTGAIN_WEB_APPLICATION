// SmartGain Frontend - API Endpoints Tests
import { describe, it, expect } from 'vitest';
import { authApi, nutritionApi, workoutApi, progressApi, dashboardApi } from '../endpoints';

describe('API Endpoints', () => {
  describe('Auth API', () => {
    it('should have all auth methods', () => {
      expect(authApi.login).toBeDefined();
      expect(authApi.register).toBeDefined();
      expect(authApi.refresh).toBeDefined();
      expect(authApi.logout).toBeDefined();
    });
  });

  describe('Nutrition API', () => {
    it('should have all nutrition methods', () => {
      expect(nutritionApi.calculate).toBeDefined();
      expect(nutritionApi.logMeal).toBeDefined();
      expect(nutritionApi.getMealLogs).toBeDefined();
      expect(nutritionApi.getMealPlan).toBeDefined();
      expect(nutritionApi.generateMealPlan).toBeDefined();
    });
  });

  describe('Workout API', () => {
    it('should have all workout methods', () => {
      expect(workoutApi.logWorkout).toBeDefined();
      expect(workoutApi.getWorkoutLogs).toBeDefined();
      expect(workoutApi.getWorkoutPlan).toBeDefined();
      expect(workoutApi.generateWorkoutPlan).toBeDefined();
    });
  });

  describe('Progress API', () => {
    it('should have all progress methods', () => {
      expect(progressApi.logWeight).toBeDefined();
      expect(progressApi.getWeightLogs).toBeDefined();
      expect(progressApi.getLatestWeight).toBeDefined();
    });
  });

  describe('Dashboard API', () => {
    it('should have dashboard method', () => {
      expect(dashboardApi.getDashboard).toBeDefined();
    });
  });
});
