import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password) {
        // Password strength validation: mixed case, numbers
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  },
  profile: {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [13, 'Age must be at least 13 years'],
      max: [120, 'Age cannot exceed 120 years']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['male', 'female'],
        message: 'Gender must be either male or female'
      }
    },
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [100, 'Height must be at least 100 cm'],
      max: [250, 'Height cannot exceed 250 cm']
    },
    currentWeight: {
      type: Number,
      required: [true, 'Current weight is required'],
      min: [30, 'Weight must be at least 30 kg'],
      max: [300, 'Weight cannot exceed 300 kg']
    },
    targetWeight: {
      type: Number,
      required: [true, 'Target weight is required'],
      min: [30, 'Target weight must be at least 30 kg'],
      max: [300, 'Target weight cannot exceed 300 kg'],
      validate: {
        validator: function(targetWeight) {
          return targetWeight > this.profile.currentWeight;
        },
        message: 'Target weight must be greater than current weight'
      }
    },
    activityLevel: {
      type: String,
      required: [true, 'Activity level is required'],
      enum: {
        values: ['sedentary', 'light', 'moderate', 'very', 'extreme'],
        message: 'Activity level must be one of: sedentary, light, moderate, very, extreme'
      }
    },
    fitnessLevel: {
      type: String,
      required: [true, 'Fitness level is required'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Fitness level must be one of: beginner, intermediate, advanced'
      }
    },
    dietaryPreferences: [{
      type: String,
      enum: {
        values: ['vegetarian', 'non-vegetarian', 'vegan'],
        message: 'Dietary preference must be one of: vegetarian, non-vegetarian, vegan'
      }
    }],
    healthConditions: [{
      type: String,
      trim: true
    }]
  },
  goals: {
    weeklyWeightGain: {
      type: Number,
      required: [true, 'Weekly weight gain goal is required'],
      min: [0.1, 'Weekly weight gain must be at least 0.1 kg'],
      max: [2.0, 'Weekly weight gain cannot exceed 2.0 kg for safety']
    },
    targetDate: {
      type: Date,
      validate: {
        validator: function(targetDate) {
          return targetDate > new Date();
        },
        message: 'Target date must be in the future'
      }
    },
    goalIntensity: {
      type: String,
      required: [true, 'Goal intensity is required'],
      enum: {
        values: ['conservative', 'moderate', 'aggressive'],
        message: 'Goal intensity must be one of: conservative, moderate, aggressive'
      }
    }
  },
  calculations: {
    bmr: {
      type: Number,
      min: [800, 'BMR cannot be less than 800 calories']
    },
    tdee: {
      type: Number,
      min: [1000, 'TDEE cannot be less than 1000 calories']
    },
    targetCalories: {
      type: Number,
      min: [1200, 'Target calories cannot be less than 1200 calories']
    },
    macroTargets: {
      protein: {
        type: Number,
        min: [0, 'Protein target cannot be negative']
      },
      carbs: {
        type: Number,
        min: [0, 'Carbs target cannot be negative']
      },
      fat: {
        type: Number,
        min: [0, 'Fat target cannot be negative']
      }
    },
    lastCalculated: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for performance optimization
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'profile.name': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'calculations.lastCalculated': -1 });

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with 12 salt rounds as specified in requirements
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if calculations need updating
userSchema.methods.needsRecalculation = function() {
  if (!this.calculations.lastCalculated) return true;
  
  // Recalculate if more than 24 hours old
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.calculations.lastCalculated < twentyFourHoursAgo;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

export default User;