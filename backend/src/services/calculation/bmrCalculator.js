/**
 * BMR (Basal Metabolic Rate) Calculator Service
 * Implements the Mifflin-St Jeor equation for accurate BMR calculations
 * Requirements: 3.1
 */

import Joi from 'joi';
import { ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/**
 * Validates BMR calculation input parameters
 * @param {Object} data - Input data containing age, gender, weight, height
 * @throws {ValidationError} If validation fails
 */
function validateBMRInput(data) {
  const schema = Joi.object({
    age: Joi.number()
      .integer()
      .min(10)
      .max(120)
      .required()
      .messages({
        'number.base': 'Age must be a number',
        'number.min': 'Age must be at least 10 years',
        'number.max': 'Age cannot exceed 120 years',
        'any.required': 'Age is required',
      }),
    gender: Joi.string()
      .valid('male', 'female')
      .required()
      .messages({
        'any.only': 'Gender must be either "male" or "female"',
        'any.required': 'Gender is required',
      }),
    weight: Joi.number()
      .positive()
      .min(30)
      .max(300)
      .required()
      .messages({
        'number.base': 'Weight must be a number',
        'number.positive': 'Weight must be positive',
        'number.min': 'Weight must be at least 30 kg',
        'number.max': 'Weight cannot exceed 300 kg',
        'any.required': 'Weight is required',
      }),
    height: Joi.number()
      .positive()
      .min(100)
      .max(250)
      .required()
      .messages({
        'number.base': 'Height must be a number',
        'number.positive': 'Height must be positive',
        'number.min': 'Height must be at least 100 cm',
        'number.max': 'Height cannot exceed 250 cm',
        'any.required': 'Height is required',
      }),
  });

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new ValidationError(
      `BMR calculation validation failed: ${messages.join(', ')}`
    );
  }

  return value;
}

/**
 * Calculates BMR using the Mifflin-St Jeor equation
 * 
 * For men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
 * For women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
 * 
 * @param {Object} data - User data containing age, gender, weight (kg), height (cm)
 * @returns {number} BMR in calories per day (rounded to nearest whole number)
 * @throws {ValidationError} If input validation fails
 */
function calculateBMR(data) {
  try {
    const validatedData = validateBMRInput(data);
    const { age, gender, weight, height } = validatedData;

    let bmr;

    if (gender === 'male') {
      // For men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      // For women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Round to nearest whole number
    bmr = Math.round(bmr);

    logger.debug('BMR calculated successfully', {
      age,
      gender,
      weight,
      height,
      bmr,
    });

    return bmr;
  } catch (error) {
    logger.error('BMR calculation failed', {
      error: error.message,
      data,
    });
    throw error;
  }
}

/**
 * Calculates BMR with detailed breakdown for transparency
 * @param {Object} data - User data containing age, gender, weight (kg), height (cm)
 * @returns {Object} Object containing BMR value and calculation breakdown
 */
function calculateBMRWithBreakdown(data) {
  const validatedData = validateBMRInput(data);
  const { age, gender, weight, height } = validatedData;

  const weightFactor = 10 * weight;
  const heightFactor = 6.25 * height;
  const ageFactor = 5 * age;
  const genderFactor = gender === 'male' ? 5 : -161;

  const bmr = Math.round(
    weightFactor + heightFactor - ageFactor + genderFactor
  );

  return {
    bmr,
    breakdown: {
      weight_contribution: weightFactor,
      height_contribution: heightFactor,
      age_contribution: -ageFactor,
      gender_contribution: genderFactor,
      total: bmr,
    },
    formula: `(10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) ${
      gender === 'male' ? '+ 5' : '- 161'
    } = ${bmr}`,
  };
}

export { calculateBMR, calculateBMRWithBreakdown, validateBMRInput };
