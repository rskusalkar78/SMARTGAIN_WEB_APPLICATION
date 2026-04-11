import Joi from 'joi';

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  
  profile: Joi.object({
    name: Joi.string()
      .trim()
      .max(100)
      .required()
      .messages({
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    
    age: Joi.number()
      .integer()
      .min(13)
      .max(120)
      .required()
      .messages({
        'number.min': 'Age must be at least 13 years',
        'number.max': 'Age cannot exceed 120 years',
        'any.required': 'Age is required'
      }),
    
    gender: Joi.string()
      .valid('male', 'female')
      .required()
      .messages({
        'any.only': 'Gender must be either male or female',
        'any.required': 'Gender is required'
      }),
    
    height: Joi.number()
      .min(100)
      .max(250)
      .required()
      .messages({
        'number.min': 'Height must be at least 100 cm',
        'number.max': 'Height cannot exceed 250 cm',
        'any.required': 'Height is required'
      }),
    
    currentWeight: Joi.number()
      .min(30)
      .max(300)
      .required()
      .messages({
        'number.min': 'Weight must be at least 30 kg',
        'number.max': 'Weight cannot exceed 300 kg',
        'any.required': 'Current weight is required'
      }),
    
    targetWeight: Joi.number()
      .min(30)
      .max(300)
      .required()
      .messages({
        'number.min': 'Target weight must be at least 30 kg',
        'number.max': 'Target weight cannot exceed 300 kg',
        'any.required': 'Target weight is required'
      }),
    
    activityLevel: Joi.string()
      .valid('sedentary', 'light', 'moderate', 'very', 'extreme')
      .required()
      .messages({
        'any.only': 'Activity level must be one of: sedentary, light, moderate, very, extreme',
        'any.required': 'Activity level is required'
      }),
    
    fitnessLevel: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .required()
      .messages({
        'any.only': 'Fitness level must be one of: beginner, intermediate, advanced',
        'any.required': 'Fitness level is required'
      }),
    
    dietaryPreferences: Joi.array()
      .items(Joi.string().valid('vegetarian', 'non-vegetarian', 'vegan'))
      .default([])
      .messages({
        'array.includes': 'Dietary preference must be one of: vegetarian, non-vegetarian, vegan'
      }),
    
    healthConditions: Joi.array()
      .items(Joi.string().trim())
      .default([])
  }).required(),
  
  goals: Joi.object({
    weeklyWeightGain: Joi.number()
      .min(0.1)
      .max(2.0)
      .required()
      .messages({
        'number.min': 'Weekly weight gain must be at least 0.1 kg',
        'number.max': 'Weekly weight gain cannot exceed 2.0 kg for safety',
        'any.required': 'Weekly weight gain goal is required'
      }),
    
    targetDate: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.greater': 'Target date must be in the future'
      }),
    
    goalIntensity: Joi.string()
      .valid('conservative', 'moderate', 'aggressive')
      .required()
      .messages({
        'any.only': 'Goal intensity must be one of: conservative, moderate, aggressive',
        'any.required': 'Goal intensity is required'
      })
  }).required()
}).custom((value, helpers) => {
  // Custom validation: target weight must be greater than current weight
  if (value.profile.targetWeight <= value.profile.currentWeight) {
    return helpers.error('custom.targetWeight');
  }
  return value;
}).messages({
  'custom.targetWeight': 'Target weight must be greater than current weight'
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Profile update validation schema
export const profileUpdateSchema = Joi.object({
  'profile.name': Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Name cannot exceed 100 characters'
    }),
  
  'profile.age': Joi.number()
    .integer()
    .min(13)
    .max(120)
    .messages({
      'number.min': 'Age must be at least 13 years',
      'number.max': 'Age cannot exceed 120 years'
    }),
  
  'profile.height': Joi.number()
    .min(100)
    .max(250)
    .messages({
      'number.min': 'Height must be at least 100 cm',
      'number.max': 'Height cannot exceed 250 cm'
    }),
  
  'profile.currentWeight': Joi.number()
    .min(30)
    .max(300)
    .messages({
      'number.min': 'Weight must be at least 30 kg',
      'number.max': 'Weight cannot exceed 300 kg'
    }),
  
  'profile.targetWeight': Joi.number()
    .min(30)
    .max(300)
    .messages({
      'number.min': 'Target weight must be at least 30 kg',
      'number.max': 'Target weight cannot exceed 300 kg'
    }),
  
  'profile.activityLevel': Joi.string()
    .valid('sedentary', 'light', 'moderate', 'very', 'extreme')
    .messages({
      'any.only': 'Activity level must be one of: sedentary, light, moderate, very, extreme'
    }),
  
  'profile.fitnessLevel': Joi.string()
    .valid('beginner', 'intermediate', 'advanced')
    .messages({
      'any.only': 'Fitness level must be one of: beginner, intermediate, advanced'
    }),
  
  'profile.dietaryPreferences': Joi.array()
    .items(Joi.string().valid('vegetarian', 'non-vegetarian', 'vegan'))
    .messages({
      'array.includes': 'Dietary preference must be one of: vegetarian, non-vegetarian, vegan'
    }),
  
  'profile.healthConditions': Joi.array()
    .items(Joi.string().trim()),
  
  'goals.weeklyWeightGain': Joi.number()
    .min(0.1)
    .max(2.0)
    .messages({
      'number.min': 'Weekly weight gain must be at least 0.1 kg',
      'number.max': 'Weekly weight gain cannot exceed 2.0 kg for safety'
    }),
  
  'goals.targetDate': Joi.date()
    .greater('now')
    .messages({
      'date.greater': 'Target date must be in the future'
    }),
  
  'goals.goalIntensity': Joi.string()
    .valid('conservative', 'moderate', 'aggressive')
    .messages({
      'any.only': 'Goal intensity must be one of: conservative, moderate, aggressive'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationErrors,
          timestamp: new Date().toISOString()
        }
      });
    }

    req.body = value;
    next();
  };
};