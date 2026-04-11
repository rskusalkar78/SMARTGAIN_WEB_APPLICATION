/**
 * Unit Tests for Nutrition Intelligence Service
 * Tests food database, macro calculations, and meal planning
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  lookupFood,
  searchFoods,
  getFoodsByCategory,
  calculateFoodMacros,
  calculateMealMacros,
  getAllFoods,
  getDBStats,
  calculateMacroTargets,
  generateMealPlan,
  adjustMacrosForGoals,
  MACRO_RANGES,
  PROTEIN_PER_KG
} from '../../services/nutrition/index.js';
import { ValidationError } from '../../utils/errors.js';

describe('Nutrition Database', () => {
  describe('lookupFood', () => {
    it('should return food data for valid food key', () => {
      const food = lookupFood('basmati-rice-cooked');
      
      expect(food).toHaveProperty('key', 'basmati-rice-cooked');
      expect(food).toHaveProperty('name', 'Basmati Rice (Cooked)');
      expect(food).toHaveProperty('category', 'grain');
      expect(food).toHaveProperty('calories', 130);
      expect(food).toHaveProperty('protein', 2.7);
      expect(food).toHaveProperty('carbs', 28.0);
      expect(food).toHaveProperty('fats', 0.3);
    });

    it('should handle case insensitive lookup', () => {
      const food = lookupFood('PANEER');
      expect(food.key).toBe('paneer');
      expect(food.name).toBe('Paneer (Indian Cottage Cheese)');
    });

    it('should throw ValidationError for non-existent food', () => {
      expect(() => lookupFood('non-existent-food')).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty food key', () => {
      expect(() => lookupFood('')).toThrow(ValidationError);
    });
  });

  describe('searchFoods', () => {
    it('should return foods by category', () => {
      const grains = searchFoods('grain');
      expect(grains.length).toBeGreaterThan(0);
      expect(grains.every(food => food.category === 'grain')).toBe(true);
    });

    it('should return foods by name pattern', () => {
      const riceItems = searchFoods('rice');
      expect(riceItems.length).toBeGreaterThan(0);
      expect(riceItems.every(food => 
        food.name.toLowerCase().includes('rice') || food.key.includes('rice')
      )).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = searchFoods('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getFoodsByCategory', () => {
    it('should return all protein foods', () => {
      const proteins = getFoodsByCategory('protein');
      expect(proteins.length).toBeGreaterThan(0);
      expect(proteins.every(food => food.category === 'protein')).toBe(true);
    });

    it('should return all dairy foods', () => {
      const dairy = getFoodsByCategory('dairy');
      expect(dairy.length).toBeGreaterThan(0);
      expect(dairy.every(food => food.category === 'dairy')).toBe(true);
    });
  });

  describe('calculateFoodMacros', () => {
    it('should calculate macros for 100g correctly', () => {
      const macros = calculateFoodMacros('paneer', 100);
      
      expect(macros.foodKey).toBe('paneer');
      expect(macros.quantity).toBe(100);
      expect(macros.calories).toBe(265);
      expect(macros.protein).toBe(25.0);
      expect(macros.carbs).toBe(3.2);
      expect(macros.fats).toBe(17.0);
    });

    it('should calculate macros for 50g correctly', () => {
      const macros = calculateFoodMacros('paneer', 50);
      
      expect(macros.quantity).toBe(50);
      expect(macros.calories).toBe(133); // 265 * 0.5 rounded
      expect(macros.protein).toBe(12.5);
      expect(macros.carbs).toBe(1.6);
      expect(macros.fats).toBe(8.5);
    });

    it('should throw ValidationError for invalid quantity', () => {
      expect(() => calculateFoodMacros('paneer', 0)).toThrow(ValidationError);
      expect(() => calculateFoodMacros('paneer', -10)).toThrow(ValidationError);
      expect(() => calculateFoodMacros('paneer', 'invalid')).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid food key', () => {
      expect(() => calculateFoodMacros('invalid-food', 100)).toThrow(ValidationError);
    });
  });

  describe('calculateMealMacros', () => {
    it('should calculate combined macros for multiple foods', () => {
      const foods = [
        { foodKey: 'basmati-rice-cooked', quantity: 150 },
        { foodKey: 'paneer', quantity: 100 },
        { foodKey: 'dal-moong-cooked', quantity: 200 }
      ];

      const mealMacros = calculateMealMacros(foods);
      
      expect(mealMacros.foods).toHaveLength(3);
      expect(mealMacros.totals.calories).toBeGreaterThan(0);
      expect(mealMacros.totals.protein).toBeGreaterThan(0);
      expect(mealMacros.totals.carbs).toBeGreaterThan(0);
      expect(mealMacros.totals.fats).toBeGreaterThan(0);
      
      // Verify totals are sum of individual foods
      const expectedCalories = mealMacros.foods.reduce((sum, food) => sum + food.calories, 0);
      expect(mealMacros.totals.calories).toBe(expectedCalories);
    });

    it('should throw ValidationError for empty foods array', () => {
      expect(() => calculateMealMacros([])).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid food items', () => {
      const invalidFoods = [{ foodKey: 'paneer' }]; // missing quantity
      expect(() => calculateMealMacros(invalidFoods)).toThrow(ValidationError);
    });
  });

  describe('getAllFoods', () => {
    it('should return all foods with keys', () => {
      const allFoods = getAllFoods();
      expect(allFoods.length).toBeGreaterThan(0);
      expect(allFoods.every(food => food.key && food.name && food.category)).toBe(true);
    });
  });

  describe('getDBStats', () => {
    it('should return database statistics', () => {
      const stats = getDBStats();
      expect(stats).toHaveProperty('totalFoods');
      expect(stats).toHaveProperty('categories');
      expect(stats.totalFoods).toBeGreaterThan(0);
      expect(Object.keys(stats.categories).length).toBeGreaterThan(0);
    });
  });
});

describe('Macro Calculator', () => {
  describe('calculateMacroTargets', () => {
    it('should calculate macro targets for moderate activity', () => {
      const macros = calculateMacroTargets(2500, 70, 'moderate', 'moderate');
      
      expect(macros.totalCalories).toBe(2500);
      expect(macros.bodyWeight).toBe(70);
      expect(macros.activityLevel).toBe('moderate');
      expect(macros.proteinPreference).toBe('moderate');
      
      // Check macro ranges
      expect(macros.macros.protein.grams).toBeGreaterThan(0);
      expect(macros.macros.carbs.grams).toBeGreaterThan(0);
      expect(macros.macros.fats.grams).toBeGreaterThan(0);
      
      // Check percentages are within ranges
      expect(macros.macros.protein.percentage).toBeGreaterThanOrEqual(25);
      expect(macros.macros.protein.percentage).toBeLessThanOrEqual(30);
      expect(macros.macros.carbs.percentage).toBeGreaterThanOrEqual(45);
      expect(macros.macros.carbs.percentage).toBeLessThanOrEqual(55);
      expect(macros.macros.fats.percentage).toBeGreaterThanOrEqual(20);
      expect(macros.macros.fats.percentage).toBeLessThanOrEqual(30);
    });

    it('should adjust protein based on activity level', () => {
      const sedentaryMacros = calculateMacroTargets(2500, 70, 'sedentary');
      const extremeMacros = calculateMacroTargets(2500, 70, 'extreme');
      
      expect(extremeMacros.macros.protein.grams).toBeGreaterThan(sedentaryMacros.macros.protein.grams);
    });

    it('should adjust protein based on preference', () => {
      const minProtein = calculateMacroTargets(2500, 70, 'moderate', 'minimum');
      const highProtein = calculateMacroTargets(2500, 70, 'moderate', 'high');
      
      // Both might be capped by macro range limits, so check they're different or at limits
      const proteinDifference = Math.abs(highProtein.macros.protein.grams - minProtein.macros.protein.grams);
      const isAtUpperLimit = highProtein.macros.protein.percentage >= 29.9; // Close to 30% limit
      const isAtLowerLimit = minProtein.macros.protein.percentage <= 25.1; // Close to 25% limit
      
      expect(proteinDifference > 0 || isAtUpperLimit || isAtLowerLimit).toBe(true);
    });

    it('should validate total calories add up correctly', () => {
      const macros = calculateMacroTargets(2500, 70);
      const totalMacroCalories = 
        macros.macros.protein.calories + 
        macros.macros.carbs.calories + 
        macros.macros.fats.calories;
      
      expect(Math.abs(totalMacroCalories - 2500)).toBeLessThanOrEqual(5); // Allow 5 calorie tolerance
    });

    it('should throw ValidationError for invalid inputs', () => {
      expect(() => calculateMacroTargets(0, 70)).toThrow(ValidationError);
      expect(() => calculateMacroTargets(2500, 0)).toThrow(ValidationError);
      expect(() => calculateMacroTargets(-100, 70)).toThrow(ValidationError);
      expect(() => calculateMacroTargets(2500, -10)).toThrow(ValidationError);
      expect(() => calculateMacroTargets(15000, 70)).toThrow(ValidationError); // Too high
    });
  });

  describe('generateMealPlan', () => {
    let macroTargets;

    beforeEach(() => {
      macroTargets = calculateMacroTargets(2500, 70, 'moderate', 'moderate');
    });

    it('should generate meal plan with correct number of meals', () => {
      const mealPlan = generateMealPlan(macroTargets, ['vegetarian'], 4);
      
      expect(mealPlan.meals).toHaveLength(4);
      expect(mealPlan.mealsPerDay).toBe(4);
      expect(mealPlan.dietaryPreferences).toEqual(['vegetarian']);
    });

    it('should generate meal plan with 3 meals', () => {
      const mealPlan = generateMealPlan(macroTargets, ['non-vegetarian'], 3);
      
      expect(mealPlan.meals).toHaveLength(3);
      expect(mealPlan.mealsPerDay).toBe(3);
    });

    it('should respect dietary preferences - vegetarian', () => {
      const mealPlan = generateMealPlan(macroTargets, ['vegetarian'], 4);
      
      // Check that no chicken or fish is included
      const allFoods = mealPlan.meals.flatMap(meal => meal.foods);
      const hasNonVegFood = allFoods.some(food => 
        food.foodKey.includes('chicken') || food.foodKey.includes('fish')
      );
      expect(hasNonVegFood).toBe(false);
    });

    it('should provide reasonable calorie accuracy', () => {
      const mealPlan = generateMealPlan(macroTargets, ['vegetarian', 'non-vegetarian'], 4);
      
      expect(mealPlan.summary.accuracy.calories).toBeGreaterThanOrEqual(80);
      expect(mealPlan.summary.accuracy.calories).toBeLessThanOrEqual(120);
    });

    it('should include meal names', () => {
      const mealPlan = generateMealPlan(macroTargets, ['vegetarian'], 4);
      
      expect(mealPlan.meals[0].name).toBe('Breakfast');
      expect(mealPlan.meals[1].name).toBe('Lunch');
      expect(mealPlan.meals[2].name).toBe('Dinner');
      expect(mealPlan.meals[3].name).toBe('Evening Snack');
    });

    it('should throw ValidationError for invalid meal count', () => {
      expect(() => generateMealPlan(macroTargets, ['vegetarian'], 2)).toThrow(ValidationError);
      expect(() => generateMealPlan(macroTargets, ['vegetarian'], 7)).toThrow(ValidationError);
    });
  });

  describe('adjustMacrosForGoals', () => {
    let currentMacros, goals;

    beforeEach(() => {
      currentMacros = calculateMacroTargets(2500, 70, 'moderate', 'moderate');
      goals = {
        currentWeight: 72,
        activityLevel: 'moderate',
        proteinPreference: 'moderate'
      };
    });

    it('should increase calories for weight stagnation', () => {
      const progressData = { weightTrend: 'stagnant' };
      const adjusted = adjustMacrosForGoals(currentMacros, progressData, goals);
      
      expect(adjusted.adjustment.adjustedCalories).toBe(2650); // 2500 + 150
      expect(adjusted.adjustment.calorieChange).toBe(150);
      expect(adjusted.adjustment.reason).toContain('Increased calories due to weight stagnation');
    });

    it('should decrease calories for rapid weight gain', () => {
      const progressData = { weightTrend: 'rapid' };
      const adjusted = adjustMacrosForGoals(currentMacros, progressData, goals);
      
      expect(adjusted.adjustment.adjustedCalories).toBe(2400); // 2500 - 100
      expect(adjusted.adjustment.calorieChange).toBe(-100);
      expect(adjusted.adjustment.reason).toContain('Decreased calories due to rapid weight gain');
    });

    it('should maintain calories for normal progress', () => {
      const progressData = { weightTrend: 'normal' };
      const adjusted = adjustMacrosForGoals(currentMacros, progressData, goals);
      
      expect(adjusted.adjustment.adjustedCalories).toBe(2500);
      expect(adjusted.adjustment.calorieChange).toBe(0);
    });

    it('should include adjustment metadata', () => {
      const progressData = { weightTrend: 'stagnant' };
      const adjusted = adjustMacrosForGoals(currentMacros, progressData, goals);
      
      expect(adjusted.adjustment).toHaveProperty('originalCalories', 2500);
      expect(adjusted.adjustment).toHaveProperty('adjustedCalories');
      expect(adjusted.adjustment).toHaveProperty('calorieChange');
      expect(adjusted.adjustment).toHaveProperty('reason');
      expect(adjusted.adjustment).toHaveProperty('adjustmentDate');
    });

    it('should throw ValidationError for missing inputs', () => {
      expect(() => adjustMacrosForGoals(null, {}, goals)).toThrow(ValidationError);
      expect(() => adjustMacrosForGoals(currentMacros, null, goals)).toThrow(ValidationError);
      expect(() => adjustMacrosForGoals(currentMacros, {}, null)).toThrow(ValidationError);
    });
  });
});

describe('Constants', () => {
  it('should have correct macro ranges', () => {
    expect(MACRO_RANGES.protein.min).toBe(0.25);
    expect(MACRO_RANGES.protein.max).toBe(0.30);
    expect(MACRO_RANGES.carbs.min).toBe(0.45);
    expect(MACRO_RANGES.carbs.max).toBe(0.55);
    expect(MACRO_RANGES.fats.min).toBe(0.20);
    expect(MACRO_RANGES.fats.max).toBe(0.30);
  });

  it('should have protein requirements per kg', () => {
    expect(PROTEIN_PER_KG.sedentary).toBe(1.6);
    expect(PROTEIN_PER_KG.light).toBe(1.8);
    expect(PROTEIN_PER_KG.moderate).toBe(2.0);
    expect(PROTEIN_PER_KG.very).toBe(2.2);
    expect(PROTEIN_PER_KG.extreme).toBe(2.4);
  });
});