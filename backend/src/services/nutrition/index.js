/**
 * Nutrition Intelligence Service Module
 * Exports all nutrition-related functions for the SmartGain backend
 */

import {
  lookupFood,
  searchFoods,
  getFoodsByCategory,
  calculateFoodMacros,
  calculateMealMacros,
  getAllFoods,
  getDBStats,
  FOOD_DATABASE,
  validateFoodLookup
} from './nutritionDatabase.js';

import {
  calculateMacroTargets,
  generateMealPlan,
  adjustMacrosForGoals,
  MACRO_RANGES,
  PROTEIN_PER_KG
} from './macroCalculator.js';

export {
  // Food Database
  lookupFood,
  searchFoods,
  getFoodsByCategory,
  calculateFoodMacros,
  calculateMealMacros,
  getAllFoods,
  getDBStats,
  FOOD_DATABASE,
  validateFoodLookup,
  
  // Macro Calculations
  calculateMacroTargets,
  generateMealPlan,
  adjustMacrosForGoals,
  MACRO_RANGES,
  PROTEIN_PER_KG
};
