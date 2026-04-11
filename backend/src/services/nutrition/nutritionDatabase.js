/**
 * Nutrition Intelligence Service - Food Database
 * Indian food database with nutritional values per 100g
 * Requirements: 4.2, 4.4
 */

import Joi from 'joi';
import { ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/**
 * Comprehensive Indian food database with nutritional values per 100g
 * Includes staple foods: rice, roti, dal, paneer, chicken, eggs
 * Also includes common Indian vegetables and accompaniments
 */
const FOOD_DATABASE = {
  // Grains and Staples
  'basmati-rice-cooked': {
    name: 'Basmati Rice (Cooked)',
    category: 'grain',
    calories: 130,
    protein: 2.7,       // grams
    carbs: 28.0,        // grams
    fats: 0.3,          // grams
    fiber: 0.4,
    unit: 'gram'
  },
  'brown-rice-cooked': {
    name: 'Brown Rice (Cooked)',
    category: 'grain',
    calories: 111,
    protein: 2.6,
    carbs: 23.0,
    fats: 0.9,
    fiber: 1.8,
    unit: 'gram'
  },
  'white-rice-cooked': {
    name: 'White Rice (Cooked)',
    category: 'grain',
    calories: 130,
    protein: 2.7,
    carbs: 28.0,
    fats: 0.3,
    fiber: 0.4,
    unit: 'gram'
  },

  // Bread
  'roti-wheat': {
    name: 'Wheat Roti',
    category: 'bread',
    calories: 280,
    protein: 8.0,
    carbs: 56.0,
    fats: 2.0,
    fiber: 3.6,
    unit: 'gram',
    serving: 55  // One roti is approximately 55g
  },
  'paratha-plain': {
    name: 'Plain Paratha',
    category: 'bread',
    calories: 318,
    protein: 6.5,
    carbs: 38.0,
    fats: 16.0,
    fiber: 1.9,
    unit: 'gram',
    serving: 80  // One paratha is approximately 80g
  },
  'naan-plain': {
    name: 'Plain Naan',
    category: 'bread',
    calories: 262,
    protein: 9.0,
    carbs: 45.0,
    fats: 3.4,
    fiber: 1.5,
    unit: 'gram',
    serving: 100  // One naan is approximately 100g
  },
  'ragi-roti': {
    name: 'Ragi (Finger Millet) Roti',
    category: 'bread',
    calories: 328,
    protein: 6.3,
    carbs: 65.0,
    fats: 1.3,
    fiber: 3.8,
    unit: 'gram',
    serving: 50
  },

  // Legumes (Dals)
  'dal-moong-cooked': {
    name: 'Moong Dal (Cooked)',
    category: 'legume',
    calories: 106,
    protein: 3.2,
    carbs: 19.2,
    fats: 0.4,
    fiber: 2.1,
    unit: 'gram'
  },
  'dal-chana-cooked': {
    name: 'Chana Dal (Cooked)',
    category: 'legume',
    calories: 102,
    protein: 3.5,
    carbs: 18.4,
    fats: 0.5,
    fiber: 2.5,
    unit: 'gram'
  },
  'dal-masoor-cooked': {
    name: 'Masoor Dal (Red Lentil) (Cooked)',
    category: 'legume',
    calories: 99,
    protein: 3.7,
    carbs: 17.5,
    fats: 0.4,
    fiber: 2.2,
    unit: 'gram'
  },
  'dal-arhar-cooked': {
    name: 'Arhar Dal (Pigeon Pea) (Cooked)',
    category: 'legume',
    calories: 120,
    protein: 3.8,
    carbs: 21.6,
    fats: 0.6,
    fiber: 2.2,
    unit: 'gram'
  },
  'chickpeas-cooked': {
    name: 'Chickpeas (Cooked)',
    category: 'legume',
    calories: 134,
    protein: 6.7,
    carbs: 22.5,
    fats: 2.1,
    fiber: 5.8,
    unit: 'gram'
  },

  // Dairy
  'paneer': {
    name: 'Paneer (Indian Cottage Cheese)',
    category: 'dairy',
    calories: 265,
    protein: 25.0,
    carbs: 3.2,
    fats: 17.0,
    fiber: 0,
    unit: 'gram'
  },
  'curd-plain': {
    name: 'Plain Yogurt (Curd)',
    category: 'dairy',
    calories: 61,
    protein: 3.5,
    carbs: 4.7,
    fats: 3.3,
    fiber: 0,
    unit: 'gram'
  },
  'milk-whole': {
    name: 'Whole Milk',
    category: 'dairy',
    calories: 61,
    protein: 3.2,
    carbs: 4.8,
    fats: 3.3,
    fiber: 0,
    unit: 'ml'  // Milk is typically measured in ml, 100ml ≈ 100g
  },
  'ghee': {
    name: 'Ghee (Clarified Butter)',
    category: 'dairy',
    calories: 900,
    protein: 0.3,
    carbs: 0.0,
    fats: 99.5,
    fiber: 0,
    unit: 'gram'
  },

  // Proteins
  'chicken-breast-cooked': {
    name: 'Chicken Breast (Boiled/Cooked)',
    category: 'protein',
    calories: 165,
    protein: 31.0,
    carbs: 0.0,
    fats: 3.6,
    fiber: 0,
    unit: 'gram'
  },
  'chicken-thigh-cooked': {
    name: 'Chicken Thigh (Cooked)',
    category: 'protein',
    calories: 209,
    protein: 26.0,
    carbs: 0.0,
    fats: 11.0,
    fiber: 0,
    unit: 'gram'
  },
  'chicken-curry': {
    name: 'Chicken Curry (with oil/ghee)',
    category: 'protein',
    calories: 142,
    protein: 17.0,
    carbs: 2.0,
    fats: 7.0,
    fiber: 0.5,
    unit: 'gram'
  },
  'fish-cooked': {
    name: 'Fish (Rohu/Catla) (Cooked)',
    category: 'protein',
    calories: 120,
    protein: 20.0,
    carbs: 0.0,
    fats: 4.5,
    fiber: 0,
    unit: 'gram'
  },

  // Eggs
  'egg-whole-boiled': {
    name: 'Whole Egg (Boiled)',
    category: 'protein',
    calories: 155,
    protein: 13.0,
    carbs: 1.1,
    fats: 11.0,
    fiber: 0,
    unit: 'gram',
    serving: 50  // One medium egg is approximately 50g
  },
  'egg-white-boiled': {
    name: 'Egg White (Boiled)',
    category: 'protein',
    calories: 52,
    protein: 11.0,
    carbs: 0.7,
    fats: 0.2,
    fiber: 0,
    unit: 'gram',
    serving: 33  // One egg white is approximately 33g
  },
  'egg-yolk-boiled': {
    name: 'Egg Yolk (Boiled)',
    category: 'protein',
    calories: 322,
    protein: 17.0,
    carbs: 0.6,
    fats: 27.0,
    fiber: 0,
    unit: 'gram',
    serving: 17  // One egg yolk is approximately 17g
  },
  'egg-scrambled': {
    name: 'Egg (Scrambled)',
    category: 'protein',
    calories: 155,
    protein: 13.0,
    carbs: 1.1,
    fats: 11.0,
    fiber: 0,
    unit: 'gram',
    serving: 50
  },

  // Vegetables
  'spinach-cooked': {
    name: 'Spinach (Cooked)',
    category: 'vegetable',
    calories: 23,
    protein: 2.7,
    carbs: 3.6,
    fats: 0.4,
    fiber: 2.2,
    unit: 'gram'
  },
  'broccoli-cooked': {
    name: 'Broccoli (Cooked)',
    category: 'vegetable',
    calories: 34,
    protein: 2.8,
    carbs: 7.0,
    fats: 0.4,
    fiber: 2.4,
    unit: 'gram'
  },
  'potato-cooked': {
    name: 'Potato (Boiled)',
    category: 'vegetable',
    calories: 77,
    protein: 1.7,
    carbs: 17.5,
    fats: 0.1,
    fiber: 2.1,
    unit: 'gram'
  },
  'sweet-potato-cooked': {
    name: 'Sweet Potato (Boiled)',
    category: 'vegetable',
    calories: 86,
    protein: 1.6,
    carbs: 20.1,
    fats: 0.1,
    fiber: 3.0,
    unit: 'gram'
  },
  'onion-raw': {
    name: 'Onion (Raw)',
    category: 'vegetable',
    calories: 40,
    protein: 1.1,
    carbs: 9.0,
    fats: 0.1,
    fiber: 1.7,
    unit: 'gram'
  },
  'tomato-raw': {
    name: 'Tomato (Raw)',
    category: 'vegetable',
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fats: 0.2,
    fiber: 1.2,
    unit: 'gram'
  },

  // Nuts and Seeds
  'peanuts-raw': {
    name: 'Peanuts (Raw)',
    category: 'nut',
    calories: 567,
    protein: 25.8,
    carbs: 16.1,
    fats: 49.2,
    fiber: 8.5,
    unit: 'gram'
  },
  'almonds': {
    name: 'Almonds (Raw)',
    category: 'nut',
    calories: 579,
    protein: 21.2,
    carbs: 21.6,
    fats: 50.6,
    fiber: 12.5,
    unit: 'gram'
  },
};

/**
 * Validates food lookup parameters
 * @param {Object} data - Input data with food key
 * @throws {ValidationError} If validation fails
 */
function validateFoodLookup(data) {
  const schema = Joi.object({
    foodKey: Joi.string()
      .required()
      .messages({
        'any.required': 'Food key is required',
        'string.base': 'Food key must be a string'
      })
  });

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new ValidationError(
      `Food lookup validation failed: ${messages.join(', ')}`
    );
  }

  return value;
}

/**
 * Looks up a food by its key in the database
 * @param {string} foodKey - The food identifier key
 * @returns {Object} Food nutritional data
 * @throws {ValidationError} If food not found
 */
function lookupFood(foodKey) {
  try {
    validateFoodLookup({ foodKey });

    const foodKeyLower = foodKey.toLowerCase();
    const food = FOOD_DATABASE[foodKeyLower];

    if (!food) {
      throw new ValidationError(
        `Food not found: "${foodKey}". Use getAllFoods() to see available options.`
      );
    }

    logger.debug('Food looked up successfully', { foodKey: foodKeyLower });
    return {
      key: foodKeyLower,
      ...food
    };
  } catch (error) {
    logger.error('Food lookup failed', {
      error: error.message,
      foodKey
    });
    throw error;
  }
}

/**
 * Searches for foods by category or name pattern
 * @param {string} query - Search query (category name or food name pattern)
 * @returns {Array} Array of matching foods
 */
function searchFoods(query) {
  const queryLower = query.toLowerCase();
  const results = [];

  for (const [key, food] of Object.entries(FOOD_DATABASE)) {
    if (
      food.category === queryLower ||
      food.name.toLowerCase().includes(queryLower) ||
      key.includes(queryLower)
    ) {
      results.push({
        key,
        ...food
      });
    }
  }

  logger.debug('Foods searched', { query, resultCount: results.length });
  return results;
}

/**
 * Gets all foods in a specific category
 * @param {string} category - Category name (grain, bread, legume, dairy, protein, vegetable, nut)
 * @returns {Array} Array of foods in the category
 */
function getFoodsByCategory(category) {
  return searchFoods(category);
}

/**
 * Calculates macros for a given quantity of food
 * @param {string} foodKey - The food identifier
 * @param {number} quantity - Quantity in grams (or ml for liquids)
 * @returns {Object} Calculated macros (calories, protein, carbs, fats, fiber)
 */
function calculateFoodMacros(foodKey, quantity) {
  try {
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      throw new ValidationError('Quantity must be a positive number');
    }

    const food = lookupFood(foodKey);

    // Per 100g values in database, so multiply by quantity/100
    const multiplier = quantity / 100;

    const macros = {
      foodKey: food.key,
      foodName: food.name,
      quantity,
      unit: food.unit,
      serving: food.serving || null,
      calories: Math.round(food.calories * multiplier),
      protein: parseFloat((food.protein * multiplier).toFixed(1)),
      carbs: parseFloat((food.carbs * multiplier).toFixed(1)),
      fats: parseFloat((food.fats * multiplier).toFixed(1)),
      fiber: parseFloat((food.fiber * multiplier).toFixed(1))
    };

    logger.debug('Food macros calculated', { foodKey, quantity, macros });
    return macros;
  } catch (error) {
    logger.error('Macro calculation failed', {
      error: error.message,
      foodKey,
      quantity
    });
    throw error;
  }
}

/**
 * Calculates combined macros for multiple foods
 * @param {Array} foods - Array of {foodKey, quantity} objects
 * @returns {Object} Combined macros
 */
function calculateMealMacros(foods) {
  try {
    if (!Array.isArray(foods) || foods.length === 0) {
      throw new ValidationError('Foods must be a non-empty array');
    }

    const mealMacros = {
      foods: [],
      totals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0
      }
    };

    for (const item of foods) {
      if (!item.foodKey || !item.quantity) {
        throw new ValidationError('Each food item must have foodKey and quantity');
      }

      const foodMacros = calculateFoodMacros(item.foodKey, item.quantity);
      mealMacros.foods.push(foodMacros);

      mealMacros.totals.calories += foodMacros.calories;
      mealMacros.totals.protein += foodMacros.protein;
      mealMacros.totals.carbs += foodMacros.carbs;
      mealMacros.totals.fats += foodMacros.fats;
      mealMacros.totals.fiber += foodMacros.fiber;
    }

    // Round totals
    mealMacros.totals.calories = Math.round(mealMacros.totals.calories);
    mealMacros.totals.protein = parseFloat(mealMacros.totals.protein.toFixed(1));
    mealMacros.totals.carbs = parseFloat(mealMacros.totals.carbs.toFixed(1));
    mealMacros.totals.fats = parseFloat(mealMacros.totals.fats.toFixed(1));
    mealMacros.totals.fiber = parseFloat(mealMacros.totals.fiber.toFixed(1));

    logger.debug('Meal macros calculated', {
      foodCount: foods.length,
      totals: mealMacros.totals
    });

    return mealMacros;
  } catch (error) {
    logger.error('Meal macro calculation failed', {
      error: error.message,
      foodCount: foods.length
    });
    throw error;
  }
}

/**
 * Gets all available foods in the database
 * @returns {Array} Array of all foods with their metadata
 */
function getAllFoods() {
  const foods = [];
  for (const [key, food] of Object.entries(FOOD_DATABASE)) {
    foods.push({
      key,
      ...food
    });
  }
  return foods;
}

/**
 * Gets food statistics (counts by category, etc.)
 * @returns {Object} Database statistics
 */
function getDBStats() {
  const categories = {};
  let totalFoods = 0;

  for (const food of Object.values(FOOD_DATABASE)) {
    categories[food.category] = (categories[food.category] || 0) + 1;
    totalFoods++;
  }

  return {
    totalFoods,
    categories
  };
}

export {
  lookupFood,
  searchFoods,
  getFoodsByCategory,
  calculateFoodMacros,
  calculateMealMacros,
  getAllFoods,
  getDBStats,
  FOOD_DATABASE,
  validateFoodLookup
};
