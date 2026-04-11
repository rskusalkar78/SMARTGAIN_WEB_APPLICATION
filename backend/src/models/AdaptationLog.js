import mongoose from 'mongoose';

const macroAdjustmentsSchema = new mongoose.Schema({
  protein: {
    type: Number,
    default: 0
  },
  carbs: {
    type: Number,
    default: 0
  },
  fat: {
    type: Number,
    default: 0
  }
}, { _id: false });

const workoutAdjustmentsSchema = new mongoose.Schema({
  volumeChange: {
    type: Number,
    min: [-50, 'Volume change cannot be less than -50%'],
    max: [50, 'Volume change cannot exceed 50%'],
    default: 0
  },
  intensityChange: {
    type: String,
    enum: {
      values: ['increase', 'decrease', 'maintain'],
      message: 'Intensity change must be one of: increase, decrease, maintain'
    },
    default: 'maintain'
  },
  restDaysAdded: {
    type: Number,
    min: [0, 'Rest days added cannot be negative'],
    max: [7, 'Cannot add more than 7 rest days'],
    default: 0
  }
}, { _id: false });

const changesSchema = new mongoose.Schema({
  calorieAdjustment: {
    type: Number,
    required: [true, 'Calorie adjustment is required'],
    min: [-500, 'Calorie adjustment cannot be less than -500'],
    max: [500, 'Calorie adjustment cannot exceed 500']
  },
  macroAdjustments: {
    type: macroAdjustmentsSchema,
    default: () => ({})
  },
  workoutAdjustments: {
    type: workoutAdjustmentsSchema,
    default: () => ({})
  }
}, { _id: false });

const adaptationLogSchema = new mongoose.Schema({
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
  trigger: {
    type: String,
    required: [true, 'Trigger is required'],
    enum: {
      values: [
        'weight_stagnation', 
        'rapid_gain', 
        'overtraining', 
        'plateau',
        'user_request',
        'scheduled_review'
      ],
      message: 'Trigger must be one of: weight_stagnation, rapid_gain, overtraining, plateau, user_request, scheduled_review'
    }
  },
  changes: {
    type: changesSchema,
    required: [true, 'Changes are required']
  },
  reasoning: {
    type: String,
    required: [true, 'Reasoning is required'],
    trim: true,
    maxlength: [1000, 'Reasoning cannot exceed 1000 characters']
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
    validate: {
      validator: function(effectiveDate) {
        return effectiveDate >= this.date;
      },
      message: 'Effective date cannot be before the adaptation date'
    }
  },
  applied: {
    type: Boolean,
    default: false
  },
  results: {
    weightChangeAfter: {
      type: Number,
      default: null
    },
    performanceChangeAfter: {
      type: Number,
      default: null
    },
    userSatisfaction: {
      type: Number,
      min: [1, 'User satisfaction must be at least 1'],
      max: [5, 'User satisfaction cannot exceed 5'],
      default: null
    },
    evaluationDate: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
adaptationLogSchema.index({ userId: 1, date: -1 });
adaptationLogSchema.index({ userId: 1, createdAt: -1 });
adaptationLogSchema.index({ userId: 1, trigger: 1 });
adaptationLogSchema.index({ userId: 1, applied: 1 });
adaptationLogSchema.index({ effectiveDate: 1 });

// Compound index for efficient user-specific queries
adaptationLogSchema.index({ userId: 1, date: 1 });
adaptationLogSchema.index({ userId: 1, trigger: 1, date: -1 });

// Pre-save middleware to set effective date if not provided
adaptationLogSchema.pre('save', function(next) {
  if (!this.effectiveDate) {
    // Default effective date to tomorrow
    this.effectiveDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Static method to get adaptations within date range for a user
adaptationLogSchema.statics.getAdaptationsInRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get pending adaptations (not yet applied)
adaptationLogSchema.statics.getPendingAdaptations = function(userId) {
  return this.find({
    userId,
    applied: false,
    effectiveDate: { $lte: new Date() }
  }).sort({ effectiveDate: 1 });
};

// Static method to get adaptations by trigger type
adaptationLogSchema.statics.getAdaptationsByTrigger = function(userId, trigger, limit = 10) {
  return this.find({ userId, trigger })
    .sort({ date: -1 })
    .limit(limit);
};

// Static method to get adaptation frequency
adaptationLogSchema.statics.getAdaptationFrequency = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const adaptations = await this.find({
    userId,
    date: { $gte: startDate }
  });
  
  const triggerCounts = adaptations.reduce((acc, adaptation) => {
    acc[adaptation.trigger] = (acc[adaptation.trigger] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalAdaptations: adaptations.length,
    averagePerWeek: Math.round((adaptations.length / days) * 7 * 10) / 10,
    triggerBreakdown: triggerCounts,
    days: days
  };
};

// Instance method to apply adaptation to user
adaptationLogSchema.methods.applyToUser = async function() {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Apply calorie adjustment
    if (this.changes.calorieAdjustment !== 0) {
      user.calculations.targetCalories += this.changes.calorieAdjustment;
    }
    
    // Apply macro adjustments
    if (this.changes.macroAdjustments) {
      if (this.changes.macroAdjustments.protein !== 0) {
        user.calculations.macroTargets.protein += this.changes.macroAdjustments.protein;
      }
      if (this.changes.macroAdjustments.carbs !== 0) {
        user.calculations.macroTargets.carbs += this.changes.macroAdjustments.carbs;
      }
      if (this.changes.macroAdjustments.fat !== 0) {
        user.calculations.macroTargets.fat += this.changes.macroAdjustments.fat;
      }
    }
    
    // Update last calculated timestamp
    user.calculations.lastCalculated = new Date();
    
    await user.save();
    
    // Mark adaptation as applied
    this.applied = true;
    await this.save();
    
    return user;
  } catch (error) {
    throw new Error(`Failed to apply adaptation: ${error.message}`);
  }
};

// Instance method to evaluate adaptation effectiveness
adaptationLogSchema.methods.evaluateEffectiveness = async function(weightChange, performanceChange, userSatisfaction) {
  this.results.weightChangeAfter = weightChange;
  this.results.performanceChangeAfter = performanceChange;
  this.results.userSatisfaction = userSatisfaction;
  this.results.evaluationDate = new Date();
  
  await this.save();
  
  // Determine effectiveness score
  let effectivenessScore = 0;
  
  // Weight change evaluation (based on trigger)
  if (this.trigger === 'weight_stagnation' && weightChange > 0) {
    effectivenessScore += 2;
  } else if (this.trigger === 'rapid_gain' && weightChange < 0.5) {
    effectivenessScore += 2;
  }
  
  // Performance change evaluation
  if (performanceChange > 0) {
    effectivenessScore += 1;
  }
  
  // User satisfaction evaluation
  if (userSatisfaction >= 4) {
    effectivenessScore += 2;
  } else if (userSatisfaction >= 3) {
    effectivenessScore += 1;
  }
  
  return {
    effectivenessScore,
    maxScore: 5,
    effectiveness: effectivenessScore >= 4 ? 'high' : effectivenessScore >= 2 ? 'moderate' : 'low'
  };
};

// Instance method to generate adaptation summary
adaptationLogSchema.methods.getSummary = function() {
  return {
    id: this._id,
    date: this.date,
    trigger: this.trigger,
    calorieChange: this.changes.calorieAdjustment,
    macroChanges: this.changes.macroAdjustments,
    workoutChanges: this.changes.workoutAdjustments,
    reasoning: this.reasoning,
    applied: this.applied,
    effectiveDate: this.effectiveDate,
    hasResults: !!this.results.evaluationDate
  };
};

const AdaptationLog = mongoose.model('AdaptationLog', adaptationLogSchema);

export default AdaptationLog;