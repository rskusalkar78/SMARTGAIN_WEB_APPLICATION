import mongoose from 'mongoose';

const setSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: [true, 'Reps are required'],
    min: [1, 'Reps must be at least 1'],
    max: [100, 'Reps cannot exceed 100']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0, 'Weight cannot be negative'],
    max: [500, 'Weight cannot exceed 500 kg']
  },
  restTime: {
    type: Number,
    min: [0, 'Rest time cannot be negative'],
    max: [600, 'Rest time cannot exceed 600 seconds']
  },
  completed: {
    type: Boolean,
    required: [true, 'Completed status is required'],
    default: true
  }
}, { _id: false });

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    maxlength: [100, 'Exercise name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Exercise category is required'],
    enum: {
      values: ['compound', 'isolation'],
      message: 'Exercise category must be either compound or isolation'
    }
  },
  muscleGroups: {
    type: [String],
    required: [true, 'Muscle groups are required'],
    validate: {
      validator: function(muscleGroups) {
        return muscleGroups && muscleGroups.length > 0;
      },
      message: 'At least one muscle group is required'
    },
    enum: {
      values: [
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 
        'forearms', 'abs', 'quads', 'hamstrings', 'glutes', 
        'calves', 'traps', 'lats'
      ],
      message: 'Invalid muscle group specified'
    }
  },
  sets: {
    type: [setSchema],
    required: [true, 'Sets are required'],
    validate: {
      validator: function(sets) {
        return sets && sets.length > 0;
      },
      message: 'At least one set is required'
    }
  },
  totalVolume: {
    type: Number,
    required: [true, 'Total volume is required'],
    min: [0, 'Total volume cannot be negative']
  },
  personalRecord: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const workoutLogSchema = new mongoose.Schema({
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
  workoutPlan: {
    type: String,
    required: [true, 'Workout plan is required'],
    enum: {
      values: ['full-body', 'upper-lower', 'push-pull-legs'],
      message: 'Workout plan must be one of: full-body, upper-lower, push-pull-legs'
    }
  },
  exercises: {
    type: [exerciseSchema],
    required: [true, 'Exercises are required'],
    validate: {
      validator: function(exercises) {
        return exercises && exercises.length > 0;
      },
      message: 'At least one exercise is required'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes'],
    max: [300, 'Duration cannot exceed 300 minutes']
  },
  intensity: {
    type: String,
    required: [true, 'Intensity is required'],
    enum: {
      values: ['light', 'moderate', 'high'],
      message: 'Intensity must be one of: light, moderate, high'
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
workoutLogSchema.index({ userId: 1, date: -1 });
workoutLogSchema.index({ userId: 1, createdAt: -1 });
workoutLogSchema.index({ date: -1 });
workoutLogSchema.index({ userId: 1, workoutPlan: 1 });

// Compound index for efficient user-specific date range queries
workoutLogSchema.index({ userId: 1, date: 1 });

// Pre-save middleware to calculate total volume for exercises
workoutLogSchema.pre('save', function(next) {
  try {
    this.exercises.forEach(exercise => {
      exercise.totalVolume = exercise.sets.reduce((total, set) => {
        if (set.completed) {
          return total + (set.reps * set.weight);
        }
        return total;
      }, 0);
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get workouts within date range for a user
workoutLogSchema.statics.getWorkoutsInRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get workout frequency for a user
workoutLogSchema.statics.getWorkoutFrequency = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const workouts = await this.find({
    userId,
    date: { $gte: startDate }
  });
  
  return {
    totalWorkouts: workouts.length,
    averagePerWeek: Math.round((workouts.length / days) * 7 * 10) / 10,
    days: days
  };
};

// Static method to check for personal records
workoutLogSchema.statics.checkPersonalRecords = async function(userId, exerciseName) {
  const workouts = await this.find({ userId }).sort({ date: -1 });
  
  let maxVolume = 0;
  let maxWeight = 0;
  
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.name === exerciseName) {
        if (exercise.totalVolume > maxVolume) {
          maxVolume = exercise.totalVolume;
        }
        
        const maxSetWeight = Math.max(...exercise.sets.map(set => set.weight));
        if (maxSetWeight > maxWeight) {
          maxWeight = maxSetWeight;
        }
      }
    }
  }
  
  return { maxVolume, maxWeight };
};

// Instance method to calculate workout summary
workoutLogSchema.methods.getWorkoutSummary = function() {
  const totalVolume = this.exercises.reduce((total, exercise) => {
    return total + exercise.totalVolume;
  }, 0);
  
  const totalSets = this.exercises.reduce((total, exercise) => {
    return total + exercise.sets.length;
  }, 0);
  
  const muscleGroups = [...new Set(
    this.exercises.flatMap(exercise => exercise.muscleGroups)
  )];
  
  const personalRecords = this.exercises.filter(exercise => exercise.personalRecord);
  
  return {
    totalVolume,
    totalSets,
    muscleGroups,
    personalRecordsCount: personalRecords.length,
    exerciseCount: this.exercises.length
  };
};

// Instance method to detect overtraining indicators
workoutLogSchema.methods.getOvertrainingIndicators = async function() {
  const recentWorkouts = await this.constructor.find({
    userId: this.userId,
    date: {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }
  }).sort({ date: -1 });
  
  const indicators = {
    highFrequency: recentWorkouts.length > 6, // More than 6 workouts in 7 days
    longDuration: this.duration > 120, // Workout longer than 2 hours
    highIntensity: this.intensity === 'high',
    consecutiveDays: false
  };
  
  // Check for consecutive high-intensity days
  if (recentWorkouts.length >= 3) {
    const lastThree = recentWorkouts.slice(0, 3);
    indicators.consecutiveDays = lastThree.every(workout => workout.intensity === 'high');
  }
  
  const overtrainingScore = Object.values(indicators).filter(Boolean).length;
  
  return {
    indicators,
    overtrainingScore,
    riskLevel: overtrainingScore >= 3 ? 'high' : overtrainingScore >= 2 ? 'moderate' : 'low'
  };
};

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

export default WorkoutLog;