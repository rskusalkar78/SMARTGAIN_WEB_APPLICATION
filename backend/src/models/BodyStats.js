import mongoose from 'mongoose';

const bodyStatsSchema = new mongoose.Schema({
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
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [30, 'Weight must be at least 30 kg'],
    max: [300, 'Weight cannot exceed 300 kg']
  },
  bodyFat: {
    type: Number,
    min: [3, 'Body fat percentage cannot be less than 3%'],
    max: [50, 'Body fat percentage cannot exceed 50%'],
    default: null
  },
  measurements: {
    chest: {
      type: Number,
      min: [50, 'Chest measurement must be at least 50 cm'],
      max: [200, 'Chest measurement cannot exceed 200 cm']
    },
    waist: {
      type: Number,
      min: [40, 'Waist measurement must be at least 40 cm'],
      max: [200, 'Waist measurement cannot exceed 200 cm']
    },
    arms: {
      type: Number,
      min: [15, 'Arm measurement must be at least 15 cm'],
      max: [80, 'Arm measurement cannot exceed 80 cm']
    },
    thighs: {
      type: Number,
      min: [30, 'Thigh measurement must be at least 30 cm'],
      max: [100, 'Thigh measurement cannot exceed 100 cm']
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
bodyStatsSchema.index({ userId: 1, date: -1 });
bodyStatsSchema.index({ userId: 1, createdAt: -1 });
bodyStatsSchema.index({ date: -1 });

// Compound index for efficient user-specific date range queries
bodyStatsSchema.index({ userId: 1, date: 1 });

// Static method to get latest stats for a user
bodyStatsSchema.statics.getLatestForUser = function(userId) {
  return this.findOne({ userId }).sort({ date: -1 });
};

// Static method to get stats within date range for a user
bodyStatsSchema.statics.getStatsInRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Instance method to calculate weight change from previous entry
bodyStatsSchema.methods.getWeightChange = async function() {
  const previousStats = await this.constructor.findOne({
    userId: this.userId,
    date: { $lt: this.date }
  }).sort({ date: -1 });
  
  if (!previousStats) return null;
  
  return {
    change: this.weight - previousStats.weight,
    daysDifference: Math.ceil((this.date - previousStats.date) / (1000 * 60 * 60 * 24)),
    previousWeight: previousStats.weight
  };
};

const BodyStats = mongoose.model('BodyStats', bodyStatsSchema);

export default BodyStats;