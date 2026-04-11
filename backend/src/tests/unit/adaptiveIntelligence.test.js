/**
 * Unit tests for Adaptive Intelligence Service
 * Tests progress analysis and adaptation logic
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  analyzeWeightTrend,
  analyzeOvertrainingPatterns,
  calculateCalorieAdjustment,
  calculateMacroAdjustments,
  calculateWorkoutAdjustments,
  generateAdaptationSummary
} from '../../services/adaptive/adaptiveIntelligence.js';
import BodyStats from '../../models/BodyStats.js';
import WorkoutLog from '../../models/WorkoutLog.js';
import User from '../../models/User.js';

// Mock the models
vi.mock('../../models/BodyStats.js');
vi.mock('../../models/WorkoutLog.js');
vi.mock('../../models/User.js');

describe('Adaptive Intelligence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateCalorieAdjustment', () => {
    it('should return 0 when no data available', () => {
      const weightTrend = { hasData: false };
      const user = { goals: { goalIntensity: 'moderate' } };
      
      const adjustment = calculateCalorieAdjustment(weightTrend, user);
      expect(adjustment).toBe(0);
    });

    it('should increase calories by 100-150 for weight stagnation', () => {
      const weightTrend = {
        hasData: true,
        isStagnant: true,
        isRapidGain: false
      };
      
      const userConservative = { 
        _id: 'user1',
        goals: { goalIntensity: 'conservative' } 
      };
      const adjustment1 = calculateCalorieAdjustment(weightTrend, userConservative);
      expect(adjustment1).toBe(100);
      
      const userModerate = { 
        _id: 'user2',
        goals: { goalIntensity: 'moderate' } 
      };
      const adjustment2 = calculateCalorieAdjustment(weightTrend, userModerate);
      expect(adjustment2).toBe(125);
      
      const userAggressive = { 
        _id: 'user3',
        goals: { goalIntensity: 'aggressive' } 
      };
      const adjustment3 = calculateCalorieAdjustment(weightTrend, userAggressive);
      expect(adjustment3).toBe(150);
    });

    it('should decrease calories by 100-150 for rapid gain', () => {
      const weightTrend = {
        hasData: true,
        isStagnant: false,
        isRapidGain: true
      };
      
      const userConservative = { 
        _id: 'user1',
        goals: { goalIntensity: 'conservative' } 
      };
      const adjustment1 = calculateCalorieAdjustment(weightTrend, userConservative);
      expect(adjustment1).toBe(-150);
      
      const userModerate = { 
        _id: 'user2',
        goals: { goalIntensity: 'moderate' } 
      };
      const adjustment2 = calculateCalorieAdjustment(weightTrend, userModerate);
      expect(adjustment2).toBe(-125);
      
      const userAggressive = { 
        _id: 'user3',
        goals: { goalIntensity: 'aggressive' } 
      };
      const adjustment3 = calculateCalorieAdjustment(weightTrend, userAggressive);
      expect(adjustment3).toBe(-100);
    });

    it('should return 0 when no adjustment needed', () => {
      const weightTrend = {
        hasData: true,
        isStagnant: false,
        isRapidGain: false
      };
      const user = { goals: { goalIntensity: 'moderate' } };
      
      const adjustment = calculateCalorieAdjustment(weightTrend, user);
      expect(adjustment).toBe(0);
    });
  });

  describe('calculateMacroAdjustments', () => {
    it('should return zero adjustments when no data available', () => {
      const weightTrend = { hasData: false };
      const user = { 
        calculations: { 
          targetCalories: 2500,
          macroTargets: { protein: 150, carbs: 300, fat: 70 }
        } 
      };
      
      const adjustments = calculateMacroAdjustments(weightTrend, user);
      expect(adjustments).toEqual({ protein: 0, carbs: 0, fat: 0 });
    });

    it('should reduce carbs by 5% for rapid gain', () => {
      const weightTrend = {
        hasData: true,
        isRapidGain: true,
        isStagnant: false
      };
      const user = { 
        calculations: { 
          targetCalories: 2500,
          macroTargets: { protein: 150, carbs: 300, fat: 70 }
        } 
      };
      
      const adjustments = calculateMacroAdjustments(weightTrend, user);
      expect(adjustments.carbs).toBe(-15); // 5% of 300
      expect(adjustments.protein).toBe(0);
      expect(adjustments.fat).toBe(0);
    });

    it('should increase carbs by 5% for stagnation', () => {
      const weightTrend = {
        hasData: true,
        isRapidGain: false,
        isStagnant: true
      };
      const user = { 
        calculations: { 
          targetCalories: 2500,
          macroTargets: { protein: 150, carbs: 300, fat: 70 }
        } 
      };
      
      const adjustments = calculateMacroAdjustments(weightTrend, user);
      expect(adjustments.carbs).toBe(15); // 5% of 300
      expect(adjustments.protein).toBe(0);
      expect(adjustments.fat).toBe(0);
    });

    it('should return zero adjustments for normal progress', () => {
      const weightTrend = {
        hasData: true,
        isRapidGain: false,
        isStagnant: false
      };
      const user = { 
        calculations: { 
          targetCalories: 2500,
          macroTargets: { protein: 150, carbs: 300, fat: 70 }
        } 
      };
      
      const adjustments = calculateMacroAdjustments(weightTrend, user);
      expect(adjustments).toEqual({ protein: 0, carbs: 0, fat: 0 });
    });
  });

  describe('calculateWorkoutAdjustments', () => {
    it('should reduce volume and add rest for overtraining', () => {
      const overtrainingAnalysis = {
        overtrainingDetected: true,
        riskLevel: 'high'
      };
      const weightTrend = { hasData: true, trend: 'gaining' };
      
      const adjustments = calculateWorkoutAdjustments(overtrainingAnalysis, weightTrend);
      expect(adjustments.volumeChange).toBe(-20);
      expect(adjustments.intensityChange).toBe('decrease');
      expect(adjustments.restDaysAdded).toBe(2);
    });

    it('should add 1 rest day for moderate overtraining risk', () => {
      const overtrainingAnalysis = {
        overtrainingDetected: true,
        riskLevel: 'moderate'
      };
      const weightTrend = { hasData: true, trend: 'gaining' };
      
      const adjustments = calculateWorkoutAdjustments(overtrainingAnalysis, weightTrend);
      expect(adjustments.volumeChange).toBe(-20);
      expect(adjustments.intensityChange).toBe('decrease');
      expect(adjustments.restDaysAdded).toBe(1);
    });

    it('should maintain workout for good progress', () => {
      const overtrainingAnalysis = {
        overtrainingDetected: false,
        riskLevel: 'low'
      };
      const weightTrend = { 
        hasData: true, 
        trend: 'gaining',
        isRapidGain: false
      };
      
      const adjustments = calculateWorkoutAdjustments(overtrainingAnalysis, weightTrend);
      expect(adjustments.volumeChange).toBe(0);
      expect(adjustments.intensityChange).toBe('maintain');
      expect(adjustments.restDaysAdded).toBe(0);
    });

    it('should maintain workout when no overtraining and rapid gain', () => {
      const overtrainingAnalysis = {
        overtrainingDetected: false,
        riskLevel: 'low'
      };
      const weightTrend = { 
        hasData: true, 
        trend: 'gaining',
        isRapidGain: true
      };
      
      const adjustments = calculateWorkoutAdjustments(overtrainingAnalysis, weightTrend);
      expect(adjustments.volumeChange).toBe(0);
      expect(adjustments.intensityChange).toBe('maintain');
      expect(adjustments.restDaysAdded).toBe(0);
    });
  });

  describe('generateAdaptationSummary', () => {
    it('should generate summary for weight stagnation', () => {
      const weightTrend = {
        isStagnant: true,
        isRapidGain: false,
        latestWeight: 75.5,
        daysBetween: 14,
        weightChange: 0.1
      };
      const overtrainingAnalysis = {
        overtrainingDetected: false
      };
      const calorieAdjustment = 125;
      
      const summary = generateAdaptationSummary(weightTrend, overtrainingAnalysis, calorieAdjustment);
      expect(summary).toContain('75.5kg');
      expect(summary).toContain('14 days');
      expect(summary).toContain('125');
      expect(summary).toContain('stable');
    });

    it('should generate summary for rapid gain', () => {
      const weightTrend = {
        isStagnant: false,
        isRapidGain: true,
        weeklyRate: 1.5
      };
      const overtrainingAnalysis = {
        overtrainingDetected: false
      };
      const calorieAdjustment = -125;
      
      const summary = generateAdaptationSummary(weightTrend, overtrainingAnalysis, calorieAdjustment);
      expect(summary).toContain('1.50kg per week');
      expect(summary).toContain('125');
      expect(summary).toContain('Reducing');
    });

    it('should generate summary for overtraining', () => {
      const weightTrend = {
        isStagnant: false,
        isRapidGain: false
      };
      const overtrainingAnalysis = {
        overtrainingDetected: true,
        totalWorkouts: 7,
        highIntensityWorkouts: 5,
        riskLevel: 'high'
      };
      const calorieAdjustment = 0;
      
      const summary = generateAdaptationSummary(weightTrend, overtrainingAnalysis, calorieAdjustment);
      expect(summary).toContain('Overtraining');
      expect(summary).toContain('7 workouts');
      expect(summary).toContain('5 high-intensity');
      expect(summary).toContain('high risk');
    });

    it('should generate summary for normal progress', () => {
      const weightTrend = {
        isStagnant: false,
        isRapidGain: false
      };
      const overtrainingAnalysis = {
        overtrainingDetected: false
      };
      const calorieAdjustment = 0;
      
      const summary = generateAdaptationSummary(weightTrend, overtrainingAnalysis, calorieAdjustment);
      expect(summary).toContain('on track');
      expect(summary).toContain('Continue');
    });

    it('should generate combined summary for multiple issues', () => {
      const weightTrend = {
        isStagnant: true,
        isRapidGain: false,
        latestWeight: 75.0,
        daysBetween: 14,
        weightChange: 0.05
      };
      const overtrainingAnalysis = {
        overtrainingDetected: true,
        totalWorkouts: 7,
        highIntensityWorkouts: 6,
        riskLevel: 'high'
      };
      const calorieAdjustment = 125;
      
      const summary = generateAdaptationSummary(weightTrend, overtrainingAnalysis, calorieAdjustment);
      expect(summary).toContain('stable');
      expect(summary).toContain('Overtraining');
      expect(summary).toContain('125');
    });
  });
});
