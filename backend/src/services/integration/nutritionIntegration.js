import { generateMealPlan, calculateMacroTargets } from '../nutrition/macroCalculator.js';
import { calculateFoodMacros } from '../nutrition/nutritionDatabase.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';

/**
 * Generate personalized meal plan for user
 * @param {string} userId - User ID
 * @param {Object} options - Meal plan options
 * @returns {Object} Generated meal plan
 */
export async function generateUserMealPlan(userId, options = {}) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { targetCalories, macroTargets } = user.calculations;
    const { dietaryPreferences } = user.profile;

    // Generate meal plan with user preferences
    const mealPlan = generateMealPlan(
      targetCalories,
      macroTargets,
      {
        dietaryPreferences: dietaryPreferences || [],
        mealsPerDay: options.mealsPerDay || 4,
        ...options
      }
    );

    logger.info('Meal plan generated', {
      userId,
      targetCalories,
      mealsCount: mealPlan.meals.length
    });

    return {
      ...mealPlan,
      user: {
        name: user.profile.name,
        dietaryPreferences
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to generate meal plan', {
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Validate meal against user dietary preferences
 * @param {Array} foods - Array of food items
 * @param {Array} dietaryPreferences - User dietary preferences
 * @returns {boolean} Whether meal is compliant
 */
export function validateMealCompliance(foods, dietaryPreferences) {
  if (!dietaryPreferences || dietaryPreferences.length === 0) {
    return true; // No restrictions
  }

  const nonVegFoods = ['chicken', 'fish', 'mutton', 'eggs'];
  const animalProducts = [...nonVegFoods, 'paneer', 'milk', 'yogurt', 'ghee'];

  for (const food of foods) {
    const foodName = food.item.toLowerCase();

    // Check vegan restrictions
    if (dietaryPreferences.includes('vegan')) {
      if (animalProducts.some(item => foodName.includes(item))) {
        return false;
      }
    }

    // Check vegetarian restrictions
    if (dietaryPreferences.includes('vegetarian')) {
      if (nonVegFoods.some(item => foodName.includes(item))) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculate nutritional breakdown for a meal
 * @param {Array} foods - Array of food items with quantities
 * @returns {Object} Nutritional totals
 */
export function calculateMealNutrition(foods) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const food of foods) {
    const nutrition = calculateFoodMacros(food.item, food.quantity);
    totalCalories += nutrition.calories;
    totalProtein += nutrition.protein;
    totalCarbs += nutrition.carbs;
    totalFat += nutrition.fat;
  }

  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10
  };
}
