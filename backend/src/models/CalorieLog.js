import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true,
    maxlength: [100, 'Food item name cannot exceed 100 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1 gram'],
    max: [2000, 'Quantity cannot exceed 2000 grams']
  },
  calories: {
    type: Number,
    required: [true, 'Calories are required'],
    min: [0, 'Calories cannot be negative']
  },
  protein: {
    type: Number,
    required: [true, 'Protein is required'],
    min: [0, 'Protein cannot be negative']
  },
  carbs: {
    type: Number,
    required: [true, 'Carbs are required'],
    min: [0, 'Carbs cannot be negative']
  },
  fat: {
    type: Number,
    required: [true, 'Fat is required'],
    min: [0, 'Fat cannot be negative']
  }
}, { _id: false });

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    enum: {
      values: ['breakfast', 'lunch', 'dinner', 'snack'],
      message: 'Meal name must be one of: breakfast, lunch, dinner, snack'
    }
  },
  foods: {
    type: [foodItemSchema],
    validate: {
      validator: function(foods) {
        return foods && foods.length > 0;
      },
      message: 'At least one food item is required per meal'
    }
  },
  totalCalories: {
    type: Number,
    required: [true, 'Total calories are required'],
    min: [0, 'Total calories cannot be negative']
  },
  totalProtein: {
    type: Number,
    required: [true, 'Total protein is required'],
    min: [0, 'Total protein cannot be negative']
  },
  totalCarbs: {
    type: Number,
    required: [true, 'Total carbs are required'],
    min: [0, 'Total carbs cannot be negative']
  },
  totalFat: {
    type: Number,
    required: [true, 'Total fat is required'],
    min: [0, 'Total fat cannot be negative']
  }
}, { _id: false });

const calorieLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  meals: {
    type: [mealSchema],
    validate: {
      validator: function(meals) {
        return meals && meals.length > 0;
      },
      message: 'At least one meal is required'
    }
  },
  dailyTotals: {
    calories: {
      type: Number,
      required: [true, 'Daily total calories are required'],
      min: [0, 'Daily total calories cannot be negative']
    },
    protein: {
      type: Number,
      required: [true, 'Daily total protein is required'],
      min: [0, 'Daily total protein cannot be negative']
    },
    carbs: {
      type: Number,
      required: [true, 'Daily total carbs are required'],
      min: [0, 'Daily total carbs cannot be negative']
    },
    fat: {
      type: Number,
      required: [true, 'Daily total fat is required'],
      min: [0, 'Daily total fat cannot be negative']
    }
  },
  targetMet: {
    type: Boolean,
    required: [true, 'Target met status is required'],
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
calorieLogSchema.index({ userId: 1, date: -1 });
calorieLogSchema.index({ userId: 1, createdAt: -1 });
calorieLogSchema.index({ date: -1 });
calorieLogSchema.index({ userId: 1, targetMet: 1 });

// Compound index for efficient user-specific date range queries
calorieLogSchema.index({ userId: 1, date: 1 });

// Pre-save middleware to calculate daily totals and target met status
calorieLogSchema.pre('save', async function(next) {
  try {
    // Calculate daily totals from meals
    const totals = this.meals.reduce((acc, meal) => {
      acc.calories += meal.totalCalories;
      acc.protein += meal.totalProtein;
      acc.carbs += meal.totalCarbs;
      acc.fat += meal.totalFat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    this.dailyTotals = totals;

    // Check if target is met (get user's target calories)
    if (this.isNew || this.isModified('meals')) {
      const User = mongoose.model('User');
      const user = await User.findById(this.userId);
      if (user && user.calculations.targetCalories) {
        // Target met if within 5% of target calories
        const tolerance = user.calculations.targetCalories * 0.05;
        this.targetMet = Math.abs(totals.calories - user.calculations.targetCalories) <= tolerance;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get logs within date range for a user
calorieLogSchema.statics.getLogsInRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get calorie streak for a user
calorieLogSchema.statics.getCalorieStreak = async function(userId) {
  const logs = await this.find({ userId, targetMet: true })
    .sort({ date: -1 })
    .limit(100); // Limit to prevent performance issues

  if (logs.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const log of logs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
      currentDate = logDate;
    } else {
      break;
    }
  }

  return streak;
};

// Instance method to calculate meal distribution
calorieLogSchema.methods.getMealDistribution = function() {
  const totalCalories = this.dailyTotals.calories;
  if (totalCalories === 0) return {};

  return this.meals.reduce((acc, meal) => {
    acc[meal.name] = {
      calories: meal.totalCalories,
      percentage: Math.round((meal.totalCalories / totalCalories) * 100)
    };
    return acc;
  }, {});
};

const CalorieLog = mongoose.model('CalorieLog', calorieLogSchema);

export default CalorieLog;