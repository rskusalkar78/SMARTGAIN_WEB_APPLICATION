/**
 * Unit tests for TDEE Calculator Service
 * Tests TDEE calculation, weight gain calories, and complete calorie planning
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTDEE,
  calculateWeightGainCalories,
  calculateTotalCalorieTarget,
  calculateCompleteCaloriePlan,
  validateCaloriePlan,
  validateTDEEInput,
  ACTIVITY_MULTIPLIERS,
  CALORIE_SURPLUS_BY_INTENSITY
} from '../../services/calculation/tdeeCalculator.js';
import { ValidationError } from '../../utils/errors.js';

describe('TDEE Calculator Service', () => {
  describe('validateTDEEInput', () => {
    it('should validate correct TDEE input data', () => {
      const validData = {
        bmr: 1800,
        activityLevel: 'moderate',
        weeklyWeightGain: 0.5,
        goalIntensity: 'moderate'
      };
      const result = validateTDEEInput(validData);
      expect(result).toEqual(validData);
    });

    it('should reject BMR below minimum (500)', () => {
      const invalidData = {
        bmr: 400,
        activityLevel: 'moderate'
      };
      expect(() => validateTDEEInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject BMR above maximum (5000)', () => {
      const invalidData = {
        bmr: 5500,
        activityLevel: 'moderate'
      };
      expect(() => validateTDEEInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject invalid activity level', () => {
      const invalidData = {
        bmr: 1800,
        activityLevel: 'invalid'
      };
      expect(() => validateTDEEInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject weekly weight gain below minimum (0.1)', () => {
      const invalidData = {
        bmr: 1800,
        activityLevel: 'moderate',
        weeklyWeightGain: 0.05
      };
      expect(() => validateTDEEInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject weekly weight gain above maximum (2.0)', () => {
      const invalidData = {
        bmr: 1800,
        activityLevel: 'moderate',
        weeklyWeightGain: 2.5
      };
      expect(() => validateTDEEInput(invalidData)).toThrow(ValidationError);
    });
  });

  describe('calculateTDEE', () => {
    it('should calculate TDEE for sedentary activity level', () => {
      const bmr = 1800;
      const result = calculateTDEE(bmr, 'sedentary');
      const expected = Math.round(bmr * ACTIVITY_MULTIPLIERS.sedentary);
      expect(result).toBe(expected);
      expect(result).toBe(2160); // 1800 * 1.2
    });

    it('should calculate TDEE for light activity level', () => {
      const bmr = 1800;
      const result = calculateTDEE(bmr, 'light');
      const expected = Math.round(bmr * ACTIVITY_MULTIPLIERS.light);
      expect(result).toBe(expected);
      expect(result).toBe(2475); // 1800 * 1.375
    });

    it('should calculate TDEE for moderate activity level', () => {
      const bmr = 1800;
      const result = calculateTDEE(bmr, 'moderate');
      const expected = Math.round(bmr * ACTIVITY_MULTIPLIERS.moderate);
      expect(result).toBe(expected);
      expect(result).toBe(2790); // 1800 * 1.55
    });

    it('should calculate TDEE for very active level', () => {
      const bmr = 1800;
      const result = calculateTDEE(bmr, 'very');
      const expected = Math.round(bmr * ACTIVITY_MULTIPLIERS.very);
      expect(result).toBe(expected);
      expect(result).toBe(3105); // 1800 * 1.725
    });

    it('should calculate TDEE for extreme activity level', () => {
      const bmr = 1800;
      const result = calculateTDEE(bmr, 'extreme');
      const expected = Math.round(bmr * ACTIVITY_MULTIPLIERS.extreme);
      expect(result).toBe(expected);
      expect(result).toBe(3420); // 1800 * 1.9
    });

    it('should return whole number', () => {
      const result = calculateTDEE(1750.5, 'moderate');
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should throw ValidationError for invalid BMR', () => {
      expect(() => calculateTDEE(400, 'moderate')).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid activity level', () => {
      expect(() => calculateTDEE(1800, 'invalid')).toThrow(ValidationError);
    });
  });

  describe('calculateWeightGainCalories', () => {
    it('should calculate calories based on weekly weight gain', () => {
      const weeklyGain = 0.5; // kg
      const result = calculateWeightGainCalories(weeklyGain);
      // 0.5 kg * 7700 kcal/kg = 3850 kcal/week
      // 3850 / 7 days = 550 kcal/day
      expect(result).toBe(550);
    });

    it('should calculate calories for conservative goal intensity', () => {
      const result = calculateWeightGainCalories(null, 'conservative');
      const expected = Math.round(
        (CALORIE_SURPLUS_BY_INTENSITY.conservative.min + 
         CALORIE_SURPLUS_BY_INTENSITY.conservative.max) / 2
      );
      expect(result).toBe(expected);
      expect(result).toBe(350); // (300 + 400) / 2
    });

    it('should calculate calories for moderate goal intensity', () => {
      const result = calculateWeightGainCalories(null, 'moderate');
      const expected = Math.round(
        (CALORIE_SURPLUS_BY_INTENSITY.moderate.min + 
         CALORIE_SURPLUS_BY_INTENSITY.moderate.max) / 2
      );
      expect(result).toBe(expected);
      expect(result).toBe(450); // (400 + 500) / 2
    });

    it('should calculate calories for aggressive goal intensity', () => {
      const result = calculateWeightGainCalories(null, 'aggressive');
      const expected = Math.round(
        (CALORIE_SURPLUS_BY_INTENSITY.aggressive.min + 
         CALORIE_SURPLUS_BY_INTENSITY.aggressive.max) / 2
      );
      expect(result).toBe(expected);
      expect(result).toBe(575); // (500 + 650) / 2
    });

    it('should enforce minimum calorie surplus (250)', () => {
      const weeklyGain = 0.1; // Very small gain
      const result = calculateWeightGainCalories(weeklyGain);
      expect(result).toBeGreaterThanOrEqual(250);
    });

    it('should enforce maximum calorie surplus (750)', () => {
      const weeklyGain = 2.0; // Maximum allowed gain
      const result = calculateWeightGainCalories(weeklyGain);
      expect(result).toBeLessThanOrEqual(750);
    });

    it('should throw ValidationError for invalid weekly weight gain', () => {
      expect(() => calculateWeightGainCalories(2.5)).toThrow(ValidationError);
      expect(() => calculateWeightGainCalories(0.05)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid goal intensity', () => {
      expect(() => calculateWeightGainCalories(null, 'invalid')).toThrow(ValidationError);
    });
  });

  describe('calculateTotalCalorieTarget', () => {
    it('should calculate total calories as TDEE + weight gain calories', () => {
      const tdee = 2500;
      const weightGainCalories = 400;
      const result = calculateTotalCalorieTarget(tdee, weightGainCalories);
      expect(result).toBe(2900);
    });

    it('should return whole number', () => {
      const result = calculateTotalCalorieTarget(2500.7, 400.3);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should throw ValidationError for invalid TDEE', () => {
      expect(() => calculateTotalCalorieTarget(0, 400)).toThrow(ValidationError);
      expect(() => calculateTotalCalorieTarget(-100, 400)).toThrow(ValidationError);
      expect(() => calculateTotalCalorieTarget('invalid', 400)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid weight gain calories', () => {
      expect(() => calculateTotalCalorieTarget(2500, -100)).toThrow(ValidationError);
      expect(() => calculateTotalCalorieTarget(2500, 'invalid')).toThrow(ValidationError);
    });
  });

  describe('calculateCompleteCaloriePlan', () => {
    const sampleUserData = {
      age: 30,
      gender: 'male',
      weight: 75,
      height: 180,
      activityLevel: 'moderate',
      weeklyWeightGain: 0.5,
      goalIntensity: 'moderate'
    };

    it('should calculate complete calorie plan', () => {
      const result = calculateCompleteCaloriePlan(sampleUserData);
      
      expect(result).toHaveProperty('bmr');
      expect(result).toHaveProperty('tdee');
      expect(result).toHaveProperty('activityMultiplier');
      expect(result).toHaveProperty('weightGainCalories');
      expect(result).toHaveProperty('impliedWeeklyGain');
      expect(result).toHaveProperty('totalCalories');
      expect(result).toHaveProperty('breakdown');

      expect(result.bmr).toBe(1730); // From BMR calculation
      expect(result.tdee).toBe(Math.round(1730 * 1.55)); // BMR * moderate multiplier
      expect(result.activityMultiplier).toBe(1.55);
      expect(result.totalCalories).toBe(result.tdee + result.weightGainCalories);
    });

    it('should calculate implied weekly gain correctly', () => {
      const result = calculateCompleteCaloriePlan(sampleUserData);
      
      // Weekly surplus = daily surplus * 7
      // Implied gain = weekly surplus / 7700 kcal per kg
      const expectedWeeklyGain = parseFloat(((result.weightGainCalories * 7) / 7700).toFixed(2));
      expect(result.impliedWeeklyGain).toBe(expectedWeeklyGain);
    });

    it('should have consistent breakdown values', () => {
      const result = calculateCompleteCaloriePlan(sampleUserData);
      
      expect(result.breakdown.maintenance).toBe(result.tdee);
      expect(result.breakdown.surplus).toBe(result.weightGainCalories);
      expect(result.breakdown.total).toBe(result.totalCalories);
    });

    it('should work with goal intensity instead of weekly weight gain', () => {
      const userData = {
        ...sampleUserData,
        weeklyWeightGain: undefined,
        goalIntensity: 'aggressive'
      };
      
      const result = calculateCompleteCaloriePlan(userData);
      expect(result).toHaveProperty('totalCalories');
      expect(result.weightGainCalories).toBe(575); // Aggressive intensity
    });

    it('should throw ValidationError for invalid user data', () => {
      const invalidData = {
        ...sampleUserData,
        age: 'invalid'
      };
      
      expect(() => calculateCompleteCaloriePlan(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateCaloriePlan', () => {
    it('should validate safe calorie plan', () => {
      const totalCalories = 2800;
      const bmr = 1800;
      const result = validateCaloriePlan(totalCalories, bmr);
      
      expect(result.safe).toBe(true);
      expect(result.surplus).toBe(1000);
      expect(result.warnings).toHaveLength(0);
      expect(result.recommendation).toBe('Plan is safe and reasonable');
    });

    it('should detect calories below BMR', () => {
      const totalCalories = 1500;
      const bmr = 1800;
      const result = validateCaloriePlan(totalCalories, bmr);
      
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Calorie target is below BMR - weight loss expected');
    });

    it('should detect excessive calorie target', () => {
      const totalCalories = 8000;
      const bmr = 1800;
      const result = validateCaloriePlan(totalCalories, bmr);
      
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Calorie target is very high - excessive fat gain likely');
    });

    it('should detect excessive daily surplus', () => {
      const totalCalories = 3000;
      const bmr = 1800;
      const result = validateCaloriePlan(totalCalories, bmr);
      
      expect(result.safe).toBe(false);
      expect(result.surplus).toBe(1200);
      expect(result.warnings).toContain('Daily surplus exceeds 1000 kcal - higher fat gain risk');
    });

    it('should detect minimal surplus', () => {
      const totalCalories = 1950;
      const bmr = 1800;
      const result = validateCaloriePlan(totalCalories, bmr);
      
      expect(result.surplus).toBe(150);
      expect(result.warnings).toContain('Daily surplus is less than 200 kcal - minimal weight gain expected');
    });
  });

  describe('Activity Multipliers', () => {
    it('should have correct activity multiplier values', () => {
      expect(ACTIVITY_MULTIPLIERS.sedentary).toBe(1.2);
      expect(ACTIVITY_MULTIPLIERS.light).toBe(1.375);
      expect(ACTIVITY_MULTIPLIERS.moderate).toBe(1.55);
      expect(ACTIVITY_MULTIPLIERS.very).toBe(1.725);
      expect(ACTIVITY_MULTIPLIERS.extreme).toBe(1.9);
    });

    it('should have increasing multiplier values', () => {
      const multipliers = Object.values(ACTIVITY_MULTIPLIERS);
      for (let i = 1; i < multipliers.length; i++) {
        expect(multipliers[i]).toBeGreaterThan(multipliers[i - 1]);
      }
    });
  });

  describe('Calorie Surplus Ranges', () => {
    it('should have correct calorie surplus ranges', () => {
      expect(CALORIE_SURPLUS_BY_INTENSITY.conservative).toEqual({ min: 300, max: 400 });
      expect(CALORIE_SURPLUS_BY_INTENSITY.moderate).toEqual({ min: 400, max: 500 });
      expect(CALORIE_SURPLUS_BY_INTENSITY.aggressive).toEqual({ min: 500, max: 650 });
    });

    it('should have increasing surplus ranges', () => {
      const conservative = CALORIE_SURPLUS_BY_INTENSITY.conservative;
      const moderate = CALORIE_SURPLUS_BY_INTENSITY.moderate;
      const aggressive = CALORIE_SURPLUS_BY_INTENSITY.aggressive;

      expect(moderate.min).toBeGreaterThanOrEqual(conservative.max);
      expect(aggressive.min).toBeGreaterThanOrEqual(moderate.max);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle decimal BMR values', () => {
      const result = calculateTDEE(1750.7, 'moderate');
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should handle minimum valid inputs', () => {
      const result = calculateTDEE(500, 'sedentary');
      expect(result).toBe(600); // 500 * 1.2
    });

    it('should handle maximum valid inputs', () => {
      const result = calculateTDEE(5000, 'extreme');
      expect(result).toBe(9500); // 5000 * 1.9
    });

    it('should maintain mathematical relationships', () => {
      const bmr = 1800;
      const activityLevel = 'moderate';
      const weeklyGain = 0.5;

      const tdee = calculateTDEE(bmr, activityLevel);
      const weightGainCalories = calculateWeightGainCalories(weeklyGain);
      const totalCalories = calculateTotalCalorieTarget(tdee, weightGainCalories);

      expect(totalCalories).toBe(tdee + weightGainCalories);
      expect(tdee).toBe(Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]));
    });
  });

  describe('Recalculation Functions', () => {
    // Mock user object for testing
    const createMockUser = (overrides = {}) => ({
      _id: 'user123',
      profile: {
        age: 30,
        gender: 'male',
        currentWeight: 75,
        height: 180,
        activityLevel: 'moderate',
        ...overrides.profile
      },
      goals: {
        weeklyWeightGain: 0.5,
        goalIntensity: 'moderate',
        ...overrides.goals
      },
      calculations: {
        bmr: null,
        tdee: null,
        targetCalories: null,
        macroTargets: {
          protein: null,
          carbs: null,
          fat: null
        },
        lastCalculated: null,
        ...overrides.calculations
      },
      needsRecalculation: function() {
        if (!this.calculations.lastCalculated) return true;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.calculations.lastCalculated < twentyFourHoursAgo;
      },
      save: async function() {
        return this;
      }
    });

    describe('recalculateUserRecommendations', () => {
      it('should calculate and update all user recommendations', async () => {
        const { recalculateUserRecommendations } = await import('../../services/calculation/index.js');
        const mockUser = createMockUser();
        
        const result = await recalculateUserRecommendations(mockUser);
        
        expect(result).toHaveProperty('bmr');
        expect(result).toHaveProperty('tdee');
        expect(result).toHaveProperty('targetCalories');
        expect(result).toHaveProperty('weightGainCalories');
        expect(result).toHaveProperty('impliedWeeklyGain');
        expect(result).toHaveProperty('macroTargets');
        expect(result).toHaveProperty('breakdown');
        expect(result).toHaveProperty('lastCalculated');

        // Verify calculations are correct
        expect(result.bmr).toBe(1730); // Expected BMR for test data
        expect(result.tdee).toBe(Math.round(1730 * 1.55)); // BMR * moderate multiplier
        expect(result.targetCalories).toBe(result.tdee + result.weightGainCalories);

        // Verify macro targets are calculated
        expect(result.macroTargets.protein).toBeGreaterThan(0);
        expect(result.macroTargets.carbs).toBeGreaterThan(0);
        expect(result.macroTargets.fat).toBeGreaterThan(0);

        // Verify user object was updated
        expect(mockUser.calculations.bmr).toBe(result.bmr);
        expect(mockUser.calculations.tdee).toBe(result.tdee);
        expect(mockUser.calculations.targetCalories).toBe(result.targetCalories);
        expect(mockUser.calculations.lastCalculated).toBeInstanceOf(Date);
      });

      it('should calculate macro targets correctly', async () => {
        const { recalculateUserRecommendations } = await import('../../services/calculation/index.js');
        const mockUser = createMockUser();
        
        const result = await recalculateUserRecommendations(mockUser);
        
        // Calculate expected macro targets
        const totalCalories = result.targetCalories;
        const expectedProtein = Math.round((totalCalories * 0.275) / 4);
        const expectedCarbs = Math.round((totalCalories * 0.50) / 4);
        const expectedFat = Math.round((totalCalories * 0.225) / 9);

        expect(result.macroTargets.protein).toBe(expectedProtein);
        expect(result.macroTargets.carbs).toBe(expectedCarbs);
        expect(result.macroTargets.fat).toBe(expectedFat);
      });

      it('should handle different user profiles', async () => {
        const { recalculateUserRecommendations } = await import('../../services/calculation/index.js');
        const mockUser = createMockUser({
          profile: {
            age: 25,
            gender: 'female',
            currentWeight: 60,
            height: 165,
            activityLevel: 'light'
          },
          goals: {
            weeklyWeightGain: 0.3,
            goalIntensity: 'conservative'
          }
        });
        
        const result = await recalculateUserRecommendations(mockUser);
        
        expect(result.bmr).toBeGreaterThan(0);
        expect(result.tdee).toBeGreaterThan(result.bmr);
        expect(result.targetCalories).toBeGreaterThan(result.tdee);
        expect(result.lastCalculated).toBeInstanceOf(Date);
      });
    });

    describe('ensureCalculationsAreCurrent', () => {
      it('should return existing calculations if current', async () => {
        const { ensureCalculationsAreCurrent } = await import('../../services/calculation/index.js');
        const mockUser = createMockUser({
          calculations: {
            bmr: 1800,
            tdee: 2500,
            targetCalories: 3000,
            macroTargets: {
              protein: 200,
              carbs: 350,
              fat: 80
            },
            lastCalculated: new Date() // Current time
          }
        });
        
        const result = await ensureCalculationsAreCurrent(mockUser);
        
        expect(result.bmr).toBe(1800);
        expect(result.tdee).toBe(2500);
        expect(result.targetCalories).toBe(3000);
        expect(result.macroTargets.protein).toBe(200);
      });

      it('should recalculate if calculations are stale', async () => {
        const { ensureCalculationsAreCurrent } = await import('../../services/calculation/index.js');
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const mockUser = createMockUser({
          calculations: {
            bmr: 1500, // Old values
            tdee: 2000,
            targetCalories: 2500,
            macroTargets: {
              protein: 150,
              carbs: 250,
              fat: 60
            },
            lastCalculated: twoDaysAgo
          }
        });
        
        const result = await ensureCalculationsAreCurrent(mockUser);
        
        // Should have new calculated values, not the old ones
        expect(result.bmr).not.toBe(1500);
        expect(result.tdee).not.toBe(2000);
        expect(result.targetCalories).not.toBe(2500);
        expect(result.lastCalculated).toBeInstanceOf(Date);
        expect(result.lastCalculated.getTime()).toBeGreaterThan(twoDaysAgo.getTime());
      });

      it('should recalculate if no previous calculations exist', async () => {
        const { ensureCalculationsAreCurrent } = await import('../../services/calculation/index.js');
        const mockUser = createMockUser({
          calculations: {
            bmr: null,
            tdee: null,
            targetCalories: null,
            macroTargets: {
              protein: null,
              carbs: null,
              fat: null
            },
            lastCalculated: null
          }
        });
        
        const result = await ensureCalculationsAreCurrent(mockUser);
        
        expect(result.bmr).toBeGreaterThan(0);
        expect(result.tdee).toBeGreaterThan(0);
        expect(result.targetCalories).toBeGreaterThan(0);
        expect(result.macroTargets.protein).toBeGreaterThan(0);
        expect(result.lastCalculated).toBeInstanceOf(Date);
      });
    });
  });
});