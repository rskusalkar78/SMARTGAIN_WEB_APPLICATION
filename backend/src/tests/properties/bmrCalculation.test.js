import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateBMR, calculateBMRWithBreakdown, validateBMRInput } from '../../services/calculation/bmrCalculator.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Property 1: BMR Calculation Accuracy
 * Validates: Requirements 3.1
 * 
 * Property: BMR calculations follow the Mifflin-St Jeor equation exactly
 * This ensures medical accuracy for the calculation engine foundation
 */

describe('Property 1: BMR Calculation Accuracy', () => {
  
  describe('BMR Calculation Correctness', () => {
    it('should calculate BMR correctly for males using Mifflin-St Jeor equation', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            weight: fc.integer({ min: 30, max: 300 }),
            height: fc.integer({ min: 100, max: 250 })
          }),
          (data) => {
            const bmr = calculateBMR({
              ...data,
              gender: 'male'
            });

            // For men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
            const expectedBMR = Math.round(
              (10 * data.weight) + (6.25 * data.height) - (5 * data.age) + 5
            );

            expect(bmr).toBe(expectedBMR);
            expect(bmr).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate BMR correctly for females using Mifflin-St Jeor equation', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            weight: fc.integer({ min: 30, max: 300 }),
            height: fc.integer({ min: 100, max: 250 })
          }),
          (data) => {
            const bmr = calculateBMR({
              ...data,
              gender: 'female'
            });

            // For women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
            const expectedBMR = Math.round(
              (10 * data.weight) + (6.25 * data.height) - (5 * data.age) - 161
            );

            expect(bmr).toBe(expectedBMR);
            expect(bmr).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return integer value always', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            weight: fc.integer({ min: 30, max: 300 }),
            height: fc.integer({ min: 100, max: 250 }),
            gender: fc.constantFrom('male', 'female')
          }),
          (data) => {
            const bmr = calculateBMR(data);

            expect(Number.isInteger(bmr)).toBe(true);
            expect(bmr).toEqual(Math.round(bmr));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Gender Difference Property', () => {
    it('should produce lower BMR for females than males (same stats)', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            weight: fc.integer({ min: 30, max: 300 }),
            height: fc.integer({ min: 100, max: 250 })
          }),
          (data) => {
            const maleBMR = calculateBMR({
              ...data,
              gender: 'male'
            });

            const femaleBMR = calculateBMR({
              ...data,
              gender: 'female'
            });

            // Gender factor difference is 5 - (-161) = 166
            // So male BMR should be approximately 166 higher than female
            expect(maleBMR - femaleBMR).toBe(166);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Weight Impact on BMR', () => {
    it('should increase BMR when weight increases', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            height: fc.integer({ min: 100, max: 250 }),
            gender: fc.constantFrom('male', 'female')
          }),
          (data) => {
            const baseWeight = 70;
            const increasedWeight = 80;

            const bmrBase = calculateBMR({
              ...data,
              weight: baseWeight
            });

            const bmrIncreased = calculateBMR({
              ...data,
              weight: increasedWeight
            });

            // Weight coefficient is 10, so 10kg increase = 100 calorie increase
            expect(bmrIncreased - bmrBase).toBe(100);
            expect(bmrIncreased).toBeGreaterThan(bmrBase);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have linear relationship with weight', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            height: fc.integer({ min: 100, max: 250 }),
            gender: fc.constantFrom('male', 'female'),
            weight: fc.integer({ min: 30, max: 250 })
          }),
          (data) => {
            const weight1 = data.weight;
            const weight2 = data.weight + 5;
            const weight3 = data.weight + 10;

            const bmr1 = calculateBMR({
              ...data,
              weight: weight1
            });

            const bmr2 = calculateBMR({
              ...data,
              weight: weight2
            });

            const bmr3 = calculateBMR({
              ...data,
              weight: weight3
            });

            // Difference should be constant (5kg = 50 calories)
            const diff1 = bmr2 - bmr1;
            const diff2 = bmr3 - bmr2;

            expect(diff1).toBe(50);
            expect(diff2).toBe(50);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Height Impact on BMR', () => {
    it('should increase BMR when height increases', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            weight: fc.integer({ min: 30, max: 300 }),
            gender: fc.constantFrom('male', 'female')
          }),
          (data) => {
            const baseHeight = 170;
            const increasedHeight = 180;

            const bmrBase = calculateBMR({
              ...data,
              height: baseHeight
            });

            const bmrIncreased = calculateBMR({
              ...data,
              height: increasedHeight
            });

            // Height coefficient is 6.25, so 10cm increase = 62.5 calories
            // This should round to approximately 62-63
            const diff = bmrIncreased - bmrBase;
            expect(diff).toBeGreaterThan(60);
            expect(diff).toBeLessThan(65);
            expect(bmrIncreased).toBeGreaterThan(bmrBase);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have linear relationship with height', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 20, max: 80 }),
            weight: fc.integer({ min: 50, max: 150 }),
            gender: fc.constantFrom('male', 'female'),
            height: fc.integer({ min: 120, max: 200 })
          }),
          (data) => {
            const height1 = data.height;
            const height2 = data.height + 10;
            const height3 = data.height + 20;

            const bmr1 = calculateBMR({
              ...data,
              height: height1
            });

            const bmr2 = calculateBMR({
              ...data,
              height: height2
            });

            const bmr3 = calculateBMR({
              ...data,
              height: height3
            });

            // Height coefficient is 6.25, so 10cm = ~62-63 calories
            // Allow larger tolerance for rounding
            const diff1 = bmr2 - bmr1;
            const diff2 = bmr3 - bmr2;

            expect(diff1).toBeGreaterThanOrEqual(61);
            expect(diff1).toBeLessThanOrEqual(64);
            expect(diff2).toBeGreaterThanOrEqual(61);
            expect(diff2).toBeLessThanOrEqual(64);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Age Impact on BMR', () => {
    it('should decrease BMR when age increases', () => {
      fc.assert(
        fc.property(
          fc.record({
            weight: fc.integer({ min: 30, max: 300 }),
            height: fc.integer({ min: 100, max: 250 }),
            gender: fc.constantFrom('male', 'female')
          }),
          (data) => {
            const baseAge = 30;
            const increasedAge = 40;

            const bmrBase = calculateBMR({
              ...data,
              age: baseAge
            });

            const bmrIncreased = calculateBMR({
              ...data,
              age: increasedAge
            });

            // Age coefficient is 5, so 10 years = 50 calorie decrease
            expect(bmrBase - bmrIncreased).toBe(50);
            expect(bmrIncreased).toBeLessThan(bmrBase);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have linear inverse relationship with age', () => {
      fc.assert(
        fc.property(
          fc.record({
            weight: fc.integer({ min: 50, max: 150 }),
            height: fc.integer({ min: 120, max: 200 }),
            gender: fc.constantFrom('male', 'female'),
            age: fc.integer({ min: 20, max: 95 })
          }),
          (data) => {
            const age1 = data.age;
            const age2 = data.age + 10;
            const age3 = data.age + 20;

            const bmr1 = calculateBMR({
              ...data,
              age: age1
            });

            const bmr2 = calculateBMR({
              ...data,
              age: age2
            });

            const bmr3 = calculateBMR({
              ...data,
              age: age3
            });

            // Age coefficient is 5, so 10 years = 50 calories decrease
            // This should be exact
            const diff1 = bmr1 - bmr2;
            const diff2 = bmr2 - bmr3;

            expect(diff1).toBe(50);
            expect(diff2).toBe(50);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid age values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -100, max: 9 }),
            fc.integer({ min: 121, max: 200 })
          ),
          (invalidAge) => {
            expect(() => {
              calculateBMR({
                age: invalidAge,
                gender: 'male',
                weight: 70,
                height: 170
              });
            }).toThrow(ValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid weight values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -100, max: 29 }),
            fc.integer({ min: 301, max: 500 })
          ),
          (invalidWeight) => {
            expect(() => {
              calculateBMR({
                age: 30,
                gender: 'male',
                weight: invalidWeight,
                height: 170
              });
            }).toThrow(ValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid height values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -100, max: 99 }),
            fc.integer({ min: 251, max: 400 })
          ),
          (invalidHeight) => {
            expect(() => {
              calculateBMR({
                age: 30,
                gender: 'male',
                weight: 70,
                height: invalidHeight
              });
            }).toThrow(ValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid gender values', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.char()).filter(s => !['male', 'female'].includes(s) && s.length > 0),
          (invalidGender) => {
            expect(() => {
              calculateBMR({
                age: 30,
                gender: invalidGender,
                weight: 70,
                height: 170
              });
            }).toThrow(ValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('BMR with Breakdown', () => {
    it('should return matching BMR values in calculateBMRWithBreakdown', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            weight: fc.integer({ min: 30, max: 300 }),
            height: fc.integer({ min: 100, max: 250 }),
            gender: fc.constantFrom('male', 'female')
          }),
          (data) => {
            const simpleBMR = calculateBMR(data);
            const breakdownResult = calculateBMRWithBreakdown(data);

            expect(breakdownResult.bmr).toBe(simpleBMR);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct breakdown components', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 10, max: 120 }),
            weight: fc.integer({ min: 30, max: 300 }),
            height: fc.integer({ min: 100, max: 250 }),
            gender: fc.constantFrom('male', 'female')
          }),
          (data) => {
            const result = calculateBMRWithBreakdown(data);
            const { breakdown } = result;

            // Verify each component
            expect(breakdown.weight_contribution).toBe(10 * data.weight);
            expect(breakdown.height_contribution).toBe(6.25 * data.height);
            expect(breakdown.age_contribution).toBe(-(5 * data.age)); // Note: negative value
            
            const genderFactor = data.gender === 'male' ? 5 : -161;
            expect(breakdown.gender_contribution).toBe(genderFactor);

            // Verify total is sum of all components
            // Note: the formula is: weight + height - (5*age) + genderFactor
            // age_contribution is already negative, so we add it
            const calculatedTotal = Math.round(
              breakdown.weight_contribution +
              breakdown.height_contribution +
              breakdown.age_contribution +
              breakdown.gender_contribution
            );
            expect(breakdown.total).toBe(calculatedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Real-World Ranges', () => {
    it('should produce realistic BMR values within expected range (900-3500 kcal)', () => {
      fc.assert(
        fc.property(
          fc.record({
            age: fc.integer({ min: 18, max: 65 }),
            weight: fc.integer({ min: 40, max: 150 }),
            height: fc.integer({ min: 150, max: 200 }),
            gender: fc.constantFrom('male', 'female')
          }),
          (data) => {
            const bmr = calculateBMR(data);

            // Realistic BMR range for general population
            expect(bmr).toBeGreaterThanOrEqual(900);
            expect(bmr).toBeLessThanOrEqual(3500);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
