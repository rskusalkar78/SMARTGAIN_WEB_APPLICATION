/**
 * Nutrition Intelligence Service - Macro Distribution Calculator
 * Implements macro target calculations and meal plan generation
 * Requirements: 4.1, 4.3, 4.5
 */

import Joi from 'joi';
import { ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import { lookupFood, calculateFoodMacros, searchFoods } from './nutritionDatabase.js';

/**
 * Macro distribution constants based on requirements
 */
const MACRO_RANGES = {
  protein: { min: 0.25, max: 0.30 }, // 25-30% of total calories
  carbs: { min: 0.45, max: 0.55 },   // 45-55% of total calories
  fats: { min: 0.20, max: 0.30 }     // 20-30% of total calories
};

/**
 * Protein requirements per kg body weight for weight gain
 */
const PROTEIN_PER_KG = {
  sedentary: 1.6,      // g/kg body weight
  light: 1.8,          // g/kg body weight
  moderate: 2.0,       // g/kg body weight
  very: 2.2,           // g/kg body weight
  extreme: 2.4         // g/kg body weight
};

/**
 * Validates macro calculation input
 */
function validateMacroInput(data) {
  const schema = Joi.object({
    totalCalories: Joi.number()
      .positive()
      .max(10000)
      .required()
      .messages({
        'number.positive': 'Total calories must be positive',
        'number.max': 'Total calories cannot exceed 10,000',
        'any.required': 'Total calories is required'
      }),
    bodyWeight: Joi.number()
      .positive()
      .max(500)
      .required()
      .messages({
        'number.positive': 'Body weight must be positive',
        'number.max': 'Body weight cannot exceed 500kg',
        'any.required': 'Body weight is required'
      }),
    activityLevel: Joi.string()
      .valid('sedentary', 'light', 'moderate', 'very', 'extreme')
      .default('moderate')
      .messages({
        'any.only': 'Activity level must be one of: sedentary, light, moderate, very, extreme'
      }),
    proteinPreference: Joi.string()
      .valid('minimum', 'moderate', 'high')
      .default('moderate')
      .messages({
        'any.only': 'Protein preference must be one of: minimum, moderate, high'
      })
  });

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new ValidationError(
      `Macro calculation validation failed: ${messages.join(', ')}`
    );
  }

  return value;
}

/**
 * Calculates macro targets based on total calories and body weight
 * @param {number} totalCalories - Target daily calories
 * @param {number} bodyWeight - User's body weight in kg
 * @param {string} activityLevel - Activity level (sedentary, light, moderate, very, extreme)
 * @param {string} proteinPreference - Protein preference (minimum, moderate, high)
 * @returns {Object} Macro targets in grams and percentages
 */
function calculateMacroTargets(totalCalories, bodyWeight, activityLevel = 'moderate', proteinPreference = 'moderate') {
  try {
    const validated = validateMacroInput({
      totalCalories,
      bodyWeight,
      activityLevel,
      proteinPreference
    });

    // Calculate protein based on body weight and activity level
    const proteinPerKg = PROTEIN_PER_KG[validated.activityLevel];
    let proteinGrams = validated.bodyWeight * proteinPerKg;

    // Adjust protein based on preference
    if (validated.proteinPreference === 'minimum') {
      proteinGrams *= 0.9; // 10% less
    } else if (validated.proteinPreference === 'high') {
      proteinGrams *= 1.1; // 10% more
    }

    // Calculate protein calories (4 calories per gram)
    const proteinCalories = proteinGrams * 4;
    const proteinPercentage = proteinCalories / validated.totalCalories;

    // Ensure protein percentage is within acceptable range
    if (proteinPercentage < MACRO_RANGES.protein.min) {
      proteinGrams = (validated.totalCalories * MACRO_RANGES.protein.min) / 4;
    } else if (proteinPercentage > MACRO_RANGES.protein.max) {
      proteinGrams = (validated.totalCalories * MACRO_RANGES.protein.max) / 4;
    }

    // Recalculate protein calories after adjustment
    const finalProteinCalories = proteinGrams * 4;
    const finalProteinPercentage = finalProteinCalories / validated.totalCalories;

    // Calculate fats (aim for middle of range: 25% of calories)
    const fatPercentage = 0.25; // 25% of total calories
    const fatCalories = validated.totalCalories * fatPercentage;
    const fatGrams = fatCalories / 9; // 9 calories per gram of fat

    // Calculate carbs (remaining calories)
    const carbCalories = validated.totalCalories - finalProteinCalories - fatCalories;
    const carbGrams = carbCalories / 4; // 4 calories per gram of carbs
    const carbPercentage = carbCalories / validated.totalCalories;

    // Validate carb percentage is within range
    if (carbPercentage < MACRO_RANGES.carbs.min || carbPercentage > MACRO_RANGES.carbs.max) {
      logger.warn('Carb percentage outside recommended range', {
        carbPercentage,
        recommendedRange: MACRO_RANGES.carbs
      });
    }

    const macroTargets = {
      totalCalories: validated.totalCalories,
      bodyWeight: validated.bodyWeight,
      activityLevel: validated.activityLevel,
      proteinPreference: validated.proteinPreference,
      macros: {
        protein: {
          grams: Math.round(proteinGrams * 10) / 10, // Round to 1 decimal
          calories: Math.round(finalProteinCalories),
          percentage: Math.round(finalProteinPercentage * 1000) / 10 // Round to 1 decimal
        },
        carbs: {
          grams: Math.round(carbGrams * 10) / 10,
          calories: Math.round(carbCalories),
          percentage: Math.round(carbPercentage * 1000) / 10
        },
        fats: {
          grams: Math.round(fatGrams * 10) / 10,
          calories: Math.round(fatCalories),
          percentage: Math.round(fatPercentage * 1000) / 10
        }
      },
      validation: {
        totalMacroCalories: Math.round(finalProteinCalories + carbCalories + fatCalories),
        caloriesDifference: Math.round(validated.totalCalories - (finalProteinCalories + carbCalories + fatCalories)),
        withinRanges: {
          protein: finalProteinPercentage >= MACRO_RANGES.protein.min && finalProteinPercentage <= MACRO_RANGES.protein.max,
          carbs: carbPercentage >= MACRO_RANGES.carbs.min && carbPercentage <= MACRO_RANGES.carbs.max,
          fats: fatPercentage >= MACRO_RANGES.fats.min && fatPercentage <= MACRO_RANGES.fats.max
        }
      }
    };

    logger.debug('Macro targets calculated', {
      totalCalories: validated.totalCalories,
      bodyWeight: validated.bodyWeight,
      macros: macroTargets.macros
    });

    return macroTargets;
  } catch (error) {
    logger.error('Macro target calculation failed', {
      error: error.message,
      totalCalories,
      bodyWeight,
      activityLevel,
      proteinPreference
    });
    throw error;
  }
}

/**
 * Validates meal plan generation input
 */
function validateMealPlanInput(data) {
  const schema = Joi.object({
    macroTargets: Joi.object({
      macros: Joi.object({
        protein: Joi.object({ grams: Joi.number().required() }).required(),
        carbs: Joi.object({ grams: Joi.number().required() }).required(),
        fats: Joi.object({ grams: Joi.number().required() }).required()
      }).required(),
      totalCalories: Joi.number().required()
    }).required(),
    dietaryPreferences: Joi.array()
      .items(Joi.string().valid('vegetarian', 'non-vegetarian', 'vegan', 'eggetarian'))
      .default(['vegetarian', 'non-vegetarian'])
      .messages({
        'array.includes': 'Dietary preferences must include valid options: vegetarian, non-vegetarian, vegan, eggetarian'
      }),
    mealsPerDay: Joi.number()
      .integer()
      .min(3)
      .max(6)
      .default(4)
      .messages({
        'number.min': 'Must have at least 3 meals per day',
        'number.max': 'Cannot have more than 6 meals per day'
      }),
    excludeFoods: Joi.array()
      .items(Joi.string())
      .default([])
  });

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new ValidationError(
      `Meal plan validation failed: ${messages.join(', ')}`
    );
  }

  return value;
}

/**
 * Generates a basic meal plan based on macro targets and dietary preferences
 * @param {Object} macroTargets - Macro targets from calculateMacroTargets
 * @param {Array} dietaryPreferences - Array of dietary preferences
 * @param {number} mealsPerDay - Number of meals per day (3-6)
 * @param {Array} excludeFoods - Array of food keys to exclude
 * @returns {Object} Generated meal plan
 */
function generateMealPlan(macroTargets, dietaryPreferences = ['vegetarian', 'non-vegetarian'], mealsPerDay = 4, excludeFoods = []) {
  try {
    const validated = validateMealPlanInput({
      macroTargets,
      dietaryPreferences,
      mealsPerDay,
      excludeFoods
    });

    // Define meal distribution (percentage of daily macros per meal)
    const mealDistribution = getMealDistribution(validated.mealsPerDay);
    
    // Filter foods based on dietary preferences
    const availableFoods = getAvailableFoods(validated.dietaryPreferences, validated.excludeFoods);
    
    // Generate meals
    const meals = [];
    let totalPlanCalories = 0;
    let totalPlanProtein = 0;
    let totalPlanCarbs = 0;
    let totalPlanFats = 0;

    for (let i = 0; i < validated.mealsPerDay; i++) {
      const mealName = getMealName(i, validated.mealsPerDay);
      const mealTargets = {
        calories: Math.round(validated.macroTargets.totalCalories * mealDistribution[i]),
        protein: Math.round(validated.macroTargets.macros.protein.grams * mealDistribution[i] * 10) / 10,
        carbs: Math.round(validated.macroTargets.macros.carbs.grams * mealDistribution[i] * 10) / 10,
        fats: Math.round(validated.macroTargets.macros.fats.grams * mealDistribution[i] * 10) / 10
      };

      const meal = generateSingleMeal(mealName, mealTargets, availableFoods);
      meals.push(meal);

      totalPlanCalories += meal.actualMacros.calories;
      totalPlanProtein += meal.actualMacros.protein;
      totalPlanCarbs += meal.actualMacros.carbs;
      totalPlanFats += meal.actualMacros.fats;
    }

    const mealPlan = {
      targets: validated.macroTargets,
      dietaryPreferences: validated.dietaryPreferences,
      mealsPerDay: validated.mealsPerDay,
      meals,
      summary: {
        targetMacros: {
          calories: validated.macroTargets.totalCalories,
          protein: validated.macroTargets.macros.protein.grams,
          carbs: validated.macroTargets.macros.carbs.grams,
          fats: validated.macroTargets.macros.fats.grams
        },
        actualMacros: {
          calories: Math.round(totalPlanCalories),
          protein: Math.round(totalPlanProtein * 10) / 10,
          carbs: Math.round(totalPlanCarbs * 10) / 10,
          fats: Math.round(totalPlanFats * 10) / 10
        },
        accuracy: {
          calories: Math.round((totalPlanCalories / validated.macroTargets.totalCalories) * 100),
          protein: Math.round((totalPlanProtein / validated.macroTargets.macros.protein.grams) * 100),
          carbs: Math.round((totalPlanCarbs / validated.macroTargets.macros.carbs.grams) * 100),
          fats: Math.round((totalPlanFats / validated.macroTargets.macros.fats.grams) * 100)
        }
      }
    };

    logger.debug('Meal plan generated', {
      mealsPerDay: validated.mealsPerDay,
      dietaryPreferences: validated.dietaryPreferences,
      accuracy: mealPlan.summary.accuracy
    });

    return mealPlan;
  } catch (error) {
    logger.error('Meal plan generation failed', {
      error: error.message,
      dietaryPreferences,
      mealsPerDay
    });
    throw error;
  }
}

/**
 * Gets meal distribution percentages based on number of meals
 */
function getMealDistribution(mealsPerDay) {
  const distributions = {
    3: [0.30, 0.40, 0.30], // Breakfast, Lunch, Dinner
    4: [0.25, 0.30, 0.30, 0.15], // Breakfast, Lunch, Dinner, Snack
    5: [0.20, 0.15, 0.30, 0.20, 0.15], // Breakfast, Mid-morning, Lunch, Evening, Dinner
    6: [0.20, 0.10, 0.25, 0.15, 0.20, 0.10] // Breakfast, Mid-morning, Lunch, Afternoon, Dinner, Late snack
  };
  
  return distributions[mealsPerDay] || distributions[4];
}

/**
 * Gets meal name based on meal index and total meals
 */
function getMealName(index, totalMeals) {
  const mealNames = {
    3: ['Breakfast', 'Lunch', 'Dinner'],
    4: ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack'],
    5: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'],
    6: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Late Snack']
  };
  
  return mealNames[totalMeals][index] || `Meal ${index + 1}`;
}

/**
 * Filters available foods based on dietary preferences
 */
function getAvailableFoods(dietaryPreferences, excludeFoods) {
  const allFoods = searchFoods(''); // Get all foods
  
  return allFoods.filter(food => {
    // Check if food is excluded
    if (excludeFoods.includes(food.key)) {
      return false;
    }
    
    // Check dietary preferences
    if (dietaryPreferences.includes('vegan')) {
      // Vegan: no animal products
      return !['dairy', 'protein'].includes(food.category) || 
             (food.category === 'protein' && !food.key.includes('chicken') && !food.key.includes('fish') && !food.key.includes('egg'));
    }
    
    if (dietaryPreferences.includes('vegetarian') && !dietaryPreferences.includes('non-vegetarian')) {
      // Vegetarian: no meat/fish but dairy and eggs OK
      return !food.key.includes('chicken') && !food.key.includes('fish');
    }
    
    if (dietaryPreferences.includes('eggetarian')) {
      // Eggetarian: vegetarian + eggs
      return !food.key.includes('chicken') && !food.key.includes('fish');
    }
    
    // Non-vegetarian or mixed preferences: all foods allowed
    return true;
  });
}

/**
 * Generates a single meal based on targets and available foods
 */
function generateSingleMeal(mealName, targets, availableFoods) {
  const foods = [];
  let remainingCalories = targets.calories;
  let remainingProtein = targets.protein;
  let remainingCarbs = targets.carbs;
  let remainingFats = targets.fats;

  // Simple meal generation strategy
  // 1. Add a protein source (if needed)
  if (remainingProtein > 5) {
    const proteinFoods = availableFoods.filter(f => 
      (f.category === 'protein' || f.key === 'paneer') && f.protein > 10
    );
    if (proteinFoods.length > 0) {
      const proteinFood = proteinFoods[Math.floor(Math.random() * proteinFoods.length)];
      const quantity = Math.min(150, Math.max(50, (remainingProtein / proteinFood.protein) * 100));
      const macros = calculateFoodMacros(proteinFood.key, quantity);
      foods.push(macros);
      
      remainingCalories -= macros.calories;
      remainingProtein -= macros.protein;
      remainingCarbs -= macros.carbs;
      remainingFats -= macros.fats;
    }
  }

  // 2. Add a carb source
  if (remainingCarbs > 10 && remainingCalories > 100) {
    const carbFoods = availableFoods.filter(f => 
      ['grain', 'bread'].includes(f.category) && f.carbs > 20
    );
    if (carbFoods.length > 0) {
      const carbFood = carbFoods[Math.floor(Math.random() * carbFoods.length)];
      const quantity = Math.min(200, Math.max(50, (remainingCarbs / carbFood.carbs) * 100));
      const macros = calculateFoodMacros(carbFood.key, quantity);
      foods.push(macros);
      
      remainingCalories -= macros.calories;
      remainingProtein -= macros.protein;
      remainingCarbs -= macros.carbs;
      remainingFats -= macros.fats;
    }
  }

  // 3. Add vegetables
  if (remainingCalories > 50) {
    const vegetables = availableFoods.filter(f => f.category === 'vegetable');
    if (vegetables.length > 0) {
      const vegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
      const quantity = Math.min(150, Math.max(50, remainingCalories / vegetable.calories * 100));
      const macros = calculateFoodMacros(vegetable.key, quantity);
      foods.push(macros);
      
      remainingCalories -= macros.calories;
      remainingProtein -= macros.protein;
      remainingCarbs -= macros.carbs;
      remainingFats -= macros.fats;
    }
  }

  // Calculate actual totals
  const actualMacros = {
    calories: foods.reduce((sum, food) => sum + food.calories, 0),
    protein: Math.round(foods.reduce((sum, food) => sum + food.protein, 0) * 10) / 10,
    carbs: Math.round(foods.reduce((sum, food) => sum + food.carbs, 0) * 10) / 10,
    fats: Math.round(foods.reduce((sum, food) => sum + food.fats, 0) * 10) / 10,
    fiber: Math.round(foods.reduce((sum, food) => sum + food.fiber, 0) * 10) / 10
  };

  return {
    name: mealName,
    targets,
    foods,
    actualMacros,
    accuracy: {
      calories: Math.round((actualMacros.calories / targets.calories) * 100),
      protein: Math.round((actualMacros.protein / targets.protein) * 100),
      carbs: Math.round((actualMacros.carbs / targets.carbs) * 100),
      fats: Math.round((actualMacros.fats / targets.fats) * 100)
    }
  };
}

/**
 * Adjusts macro targets based on user progress and goals
 * @param {Object} currentMacros - Current macro targets
 * @param {Object} progressData - User progress data
 * @param {Object} goals - User goals and preferences
 * @returns {Object} Adjusted macro targets
 */
function adjustMacrosForGoals(currentMacros, progressData, goals) {
  try {
    // Validate inputs
    if (!currentMacros || !progressData || !goals) {
      throw new ValidationError('Current macros, progress data, and goals are required');
    }

    let adjustedCalories = currentMacros.totalCalories;
    let adjustmentReason = [];

    // Analyze weight progress
    if (progressData.weightTrend) {
      if (progressData.weightTrend === 'stagnant') {
        // No weight gain for 2+ weeks - increase calories
        adjustedCalories += 150;
        adjustmentReason.push('Increased calories due to weight stagnation');
      } else if (progressData.weightTrend === 'rapid') {
        // Gaining too fast (>1kg/week) - decrease calories
        adjustedCalories -= 100;
        adjustmentReason.push('Decreased calories due to rapid weight gain');
      }
    }

    // Analyze body composition if available
    if (progressData.bodyComposition) {
      if (progressData.bodyComposition.fatGainRatio > 0.6) {
        // Too much fat gain - increase protein percentage
        adjustmentReason.push('Increased protein percentage to improve body composition');
      }
    }

    // Recalculate macros with adjusted calories
    const adjustedMacros = calculateMacroTargets(
      adjustedCalories,
      goals.currentWeight || currentMacros.bodyWeight,
      goals.activityLevel || 'moderate',
      goals.proteinPreference || 'moderate'
    );

    // Add adjustment metadata
    adjustedMacros.adjustment = {
      originalCalories: currentMacros.totalCalories,
      adjustedCalories,
      calorieChange: adjustedCalories - currentMacros.totalCalories,
      reason: adjustmentReason,
      adjustmentDate: new Date().toISOString()
    };

    logger.info('Macros adjusted based on progress', {
      originalCalories: currentMacros.totalCalories,
      adjustedCalories,
      calorieChange: adjustedCalories - currentMacros.totalCalories,
      reason: adjustmentReason
    });

    return adjustedMacros;
  } catch (error) {
    logger.error('Macro adjustment failed', {
      error: error.message,
      progressData,
      goals
    });
    throw error;
  }
}

export {
  calculateMacroTargets,
  generateMealPlan,
  adjustMacrosForGoals,
  MACRO_RANGES,
  PROTEIN_PER_KG
};