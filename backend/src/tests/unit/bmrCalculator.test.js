/**
 * Unit tests for BMR Calculator Service
 * Tests the Mifflin-St Jeor equation implementation and input validation
 * Requirements: 3.1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculateBMR,
  calculateBMRWithBreakdown,
  validateBMRInput,
} from '../../services/calculation/bmrCalculator.js';
import { ValidationError } from '../../utils/errors.js';

describe('BMR Calculator Service', () => {
  describe('validateBMRInput', () => {
    it('should validate correct input data', () => {
      const validData = {
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
      };
      const result = validateBMRInput(validData);
      expect(result).toEqual(validData);
    });

    it('should reject missing age', () => {
      const invalidData = {
        gender: 'male',
        weight: 75,
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject invalid gender', () => {
      const invalidData = {
        age: 30,
        gender: 'other',
        weight: 75,
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject age below minimum (10)', () => {
      const invalidData = {
        age: 9,
        gender: 'male',
        weight: 75,
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject age above maximum (120)', () => {
      const invalidData = {
        age: 121,
        gender: 'male',
        weight: 75,
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject weight below minimum (30kg)', () => {
      const invalidData = {
        age: 30,
        gender: 'male',
        weight: 29,
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject weight above maximum (300kg)', () => {
      const invalidData = {
        age: 30,
        gender: 'male',
        weight: 301,
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject height below minimum (100cm)', () => {
      const invalidData = {
        age: 30,
        gender: 'male',
        weight: 75,
        height: 99,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject height above maximum (250cm)', () => {
      const invalidData = {
        age: 30,
        gender: 'male',
        weight: 75,
        height: 251,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject non-numeric age', () => {
      const invalidData = {
        age: 'thirty',
        gender: 'male',
        weight: 75,
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should reject non-numeric weight', () => {
      const invalidData = {
        age: 30,
        gender: 'male',
        weight: 'seventy-five',
        height: 180,
      };
      expect(() => validateBMRInput(invalidData)).toThrow(ValidationError);
    });

    it('should strip unknown properties', () => {
      const dataWithExtra = {
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
        unknownField: 'should be removed',
      };
      const result = validateBMRInput(dataWithExtra);
      expect(result).toEqual({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
      });
      expect(result.unknownField).toBeUndefined();
    });
  });

  describe('calculateBMR', () => {
    it('should calculate BMR for an adult male correctly', () => {
      // Known value: 30-year-old male, 75kg, 180cm
      // BMR = (10 × 75) + (6.25 × 180) - (5 × 30) + 5
      // BMR = 750 + 1125 - 150 + 5 = 1730
      const result = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
      });
      expect(result).toBe(1730);
    });

    it('should calculate BMR for an adult female correctly', () => {
      // Known value: 30-year-old female, 65kg, 165cm
      // BMR = (10 × 65) + (6.25 × 165) - (5 × 30) - 161
      // BMR = 650 + 1031.25 - 150 - 161 = 1370.25 ≈ 1370
      const result = calculateBMR({
        age: 30,
        gender: 'female',
        weight: 65,
        height: 165,
      });
      expect(result).toBe(1370);
    });

    it('should calculate BMR for a young male', () => {
      // Known value: 20-year-old male, 70kg, 175cm
      // BMR = (10 × 70) + (6.25 × 175) - (5 × 20) + 5
      // BMR = 700 + 1093.75 - 100 + 5 = 1698.75 ≈ 1699
      const result = calculateBMR({
        age: 20,
        gender: 'male',
        weight: 70,
        height: 175,
      });
      expect(result).toBe(1699);
    });

    it('should calculate BMR for an elderly female', () => {
      // Known value: 70-year-old female, 60kg, 160cm
      // BMR = (10 × 60) + (6.25 × 160) - (5 × 70) - 161
      // BMR = 600 + 1000 - 350 - 161 = 1089
      const result = calculateBMR({
        age: 70,
        gender: 'female',
        weight: 60,
        height: 160,
      });
      expect(result).toBe(1089);
    });

    it('should return a whole number', () => {
      const result = calculateBMR({
        age: 25,
        gender: 'male',
        weight: 72.5,
        height: 177.5,
      });
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should handle minimum valid inputs', () => {
      const result = calculateBMR({
        age: 10,
        gender: 'male',
        weight: 30,
        height: 100,
      });
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle maximum valid inputs', () => {
      const result = calculateBMR({
        age: 120,
        gender: 'female',
        weight: 300,
        height: 250,
      });
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should throw ValidationError for invalid input', () => {
      expect(() => calculateBMR({
        age: 'invalid',
        gender: 'male',
        weight: 75,
        height: 180,
      })).toThrow(ValidationError);
    });
  });

  describe('calculateBMRWithBreakdown', () => {
    it('should return BMR with breakdown for male', () => {
      const result = calculateBMRWithBreakdown({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
      });

      expect(result).toHaveProperty('bmr');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('formula');
      expect(result.bmr).toBe(1730);
      expect(result.breakdown.weight_contribution).toBe(750);
      expect(result.breakdown.height_contribution).toBe(1125);
      expect(result.breakdown.age_contribution).toBe(-150);
      expect(result.breakdown.gender_contribution).toBe(5);
      expect(result.breakdown.total).toBe(1730);
    });

    it('should return BMR with breakdown for female', () => {
      const result = calculateBMRWithBreakdown({
        age: 30,
        gender: 'female',
        weight: 65,
        height: 165,
      });

      expect(result).toHaveProperty('bmr');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('formula');
      expect(result.bmr).toBe(1370);
      expect(result.breakdown.weight_contribution).toBe(650);
      expect(result.breakdown.height_contribution).toBe(1031.25);
      expect(result.breakdown.age_contribution).toBe(-150);
      expect(result.breakdown.gender_contribution).toBe(-161);
      expect(result.breakdown.total).toBe(1370);
    });

    it('should include formula string in breakdown', () => {
      const result = calculateBMRWithBreakdown({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
      });

      expect(result.formula).toContain('75');
      expect(result.formula).toContain('180');
      expect(result.formula).toContain('30');
      expect(result.formula).toContain('1730');
    });

    it('should throw ValidationError for invalid input', () => {
      expect(() => calculateBMRWithBreakdown({
        age: 121,
        gender: 'male',
        weight: 75,
        height: 180,
      })).toThrow(ValidationError);
    });
  });

  describe('Edge cases and accuracy', () => {
    it('should handle decimal weight values', () => {
      const result = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 75.5,
        height: 180,
      });
      expect(typeof result).toBe('number');
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should handle decimal height values', () => {
      const result = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180.5,
      });
      expect(typeof result).toBe('number');
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should consistently round BMR to nearest whole number', () => {
      // Test case that results in decimal BMR
      const result1 = calculateBMR({
        age: 25,
        gender: 'female',
        weight: 65.5,
        height: 165.5,
      });

      const result2 = calculateBMRWithBreakdown({
        age: 25,
        gender: 'female',
        weight: 65.5,
        height: 165.5,
      });

      expect(result1).toBe(result2.bmr);
      expect(Number.isInteger(result1)).toBe(true);
    });

    it('BMR should increase with weight', () => {
      const bmr1 = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 70,
        height: 180,
      });

      const bmr2 = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 80,
        height: 180,
      });

      expect(bmr2).toBeGreaterThan(bmr1);
    });

    it('BMR should increase with height', () => {
      const bmr1 = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 170,
      });

      const bmr2 = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 190,
      });

      expect(bmr2).toBeGreaterThan(bmr1);
    });

    it('BMR should decrease with age', () => {
      const bmr1 = calculateBMR({
        age: 20,
        gender: 'male',
        weight: 75,
        height: 180,
      });

      const bmr2 = calculateBMR({
        age: 60,
        gender: 'male',
        weight: 75,
        height: 180,
      });

      expect(bmr2).toBeLessThan(bmr1);
    });

    it('male BMR should be greater than female BMR with same stats', () => {
      const maleBMR = calculateBMR({
        age: 30,
        gender: 'male',
        weight: 75,
        height: 180,
      });

      const femaleBMR = calculateBMR({
        age: 30,
        gender: 'female',
        weight: 75,
        height: 180,
      });

      // Male BMR should be higher due to +5 vs -161 gender factor
      expect(maleBMR).toBeGreaterThan(femaleBMR);
    });
  });
});
