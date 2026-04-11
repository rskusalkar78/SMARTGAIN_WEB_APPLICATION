import BodyStats from '../../models/BodyStats.js';
import CalorieLog from '../../models/CalorieLog.js';
import WorkoutLog from '../../models/WorkoutLog.js';
import AdaptationLog from '../../models/AdaptationLog.js';

/**
 * Progress Tracker Service
 * Provides comprehensive progress tracking, analytics, and milestone detection
 */

/**
 * Calculate weight trends over specified timeframe
 * @param {string} userId - User ID
 * @param {string} timeframe - 'weekly' or 'monthly'
 * @returns {Object} Weight trend data
 */
export async function calculateWeightTrend(userId, timeframe = 'weekly') {
  const days = timeframe === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await BodyStats.getStatsInRange(userId, startDate, new Date());
  
  if (stats.length === 0) {
    return {
      timeframe,
      days,
      dataPoints: 0,
      trend: 'insufficient_data',
      averageWeight: null,
      weightChange: null,
      changePerWeek: null,
      startWeight: null,
      endWeight: null,
      consistency: 0
    };
  }
  
  // Sort by date ascending for trend calculation
  const sortedStats = stats.sort((a, b) => a.date - b.date);
  
  const startWeight = sortedStats[0].weight;
  const endWeight = sortedStats[sortedStats.length - 1].weight;
  const weightChange = endWeight - startWeight;
  
  // Calculate average weight
  const averageWeight = sortedStats.reduce((sum, stat) => sum + stat.weight, 0) / sortedStats.length;
  
  // Calculate change per week
  const actualDays = Math.ceil((sortedStats[sortedStats.length - 1].date - sortedStats[0].date) / (1000 * 60 * 60 * 24));
  const changePerWeek = actualDays > 0 ? (weightChange / actualDays) * 7 : 0;
  
  // Determine trend direction
  let trend;
  if (Math.abs(weightChange) < 0.2) {
    trend = 'stable';
  } else if (weightChange > 0) {
    trend = changePerWeek > 1 ? 'rapid_gain' : 'gaining';
  } else {
    trend = changePerWeek < -1 ? 'rapid_loss' : 'losing';
  }
  
  // Calculate consistency (how many days have data)
  const consistency = Math.round((sortedStats.length / days) * 100);
  
  return {
    timeframe,
    days,
    dataPoints: sortedStats.length,
    trend,
    averageWeight: Math.round(averageWeight * 10) / 10,
    weightChange: Math.round(weightChange * 10) / 10,
    changePerWeek: Math.round(changePerWeek * 100) / 100,
    startWeight: Math.round(startWeight * 10) / 10,
    endWeight: Math.round(endWeight * 10) / 10,
    consistency,
    data: sortedStats.map(stat => ({
      date: stat.date,
      weight: stat.weight
    }))
  };
}

/**
 * Calculate calorie streak and consistency metrics
 * @param {string} userId - User ID
 * @returns {Object} Calorie tracking metrics
 */
export async function calculateCalorieMetrics(userId) {
  // Get current streak
  const currentStreak = await CalorieLog.getCalorieStreak(userId);
  
  // Get last 30 days of logs
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentLogs = await CalorieLog.getLogsInRange(userId, thirtyDaysAgo, new Date());
  
  // Calculate consistency percentage
  const daysWithLogs = recentLogs.length;
  const consistencyPercentage = Math.round((daysWithLogs / 30) * 100);
  
  // Calculate target met percentage
  const targetMetCount = recentLogs.filter(log => log.targetMet).length;
  const targetMetPercentage = daysWithLogs > 0 ? Math.round((targetMetCount / daysWithLogs) * 100) : 0;
  
  // Calculate average daily calories
  const totalCalories = recentLogs.reduce((sum, log) => sum + log.dailyTotals.calories, 0);
  const averageDailyCalories = daysWithLogs > 0 ? Math.round(totalCalories / daysWithLogs) : 0;
  
  // Calculate average macros
  const totalProtein = recentLogs.reduce((sum, log) => sum + log.dailyTotals.protein, 0);
  const totalCarbs = recentLogs.reduce((sum, log) => sum + log.dailyTotals.carbs, 0);
  const totalFat = recentLogs.reduce((sum, log) => sum + log.dailyTotals.fat, 0);
  
  const averageMacros = daysWithLogs > 0 ? {
    protein: Math.round(totalProtein / daysWithLogs),
    carbs: Math.round(totalCarbs / daysWithLogs),
    fat: Math.round(totalFat / daysWithLogs)
  } : { protein: 0, carbs: 0, fat: 0 };
  
  // Find longest streak in last 30 days
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedLogs = recentLogs.sort((a, b) => a.date - b.date);
  
  for (let i = 0; i < sortedLogs.length; i++) {
    if (sortedLogs[i].targetMet) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }
  
  return {
    currentStreak,
    longestStreak,
    daysLogged: daysWithLogs,
    consistencyPercentage,
    targetMetPercentage,
    averageDailyCalories,
    averageMacros,
    period: '30 days'
  };
}

/**
 * Detect and return milestones achieved
 * @param {string} userId - User ID
 * @returns {Array} Array of milestone objects
 */
export async function detectMilestones(userId) {
  const milestones = [];
  
  // Weight milestones
  const allStats = await BodyStats.find({ userId }).sort({ date: 1 });
  if (allStats.length >= 2) {
    const firstWeight = allStats[0].weight;
    const latestWeight = allStats[allStats.length - 1].weight;
    const totalGain = latestWeight - firstWeight;
    
    // Check for weight gain milestones (every 2.5kg)
    const milestoneWeights = [2.5, 5, 7.5, 10, 12.5, 15, 20, 25];
    for (const milestone of milestoneWeights) {
      if (totalGain >= milestone) {
        milestones.push({
          type: 'weight_gain',
          value: milestone,
          unit: 'kg',
          description: `Gained ${milestone}kg from starting weight`,
          achievedDate: allStats[allStats.length - 1].date,
          category: 'progress'
        });
      }
    }
  }
  
  // Calorie streak milestones
  const currentStreak = await CalorieLog.getCalorieStreak(userId);
  const streakMilestones = [7, 14, 21, 30, 60, 90, 100];
  for (const milestone of streakMilestones) {
    if (currentStreak >= milestone) {
      milestones.push({
        type: 'calorie_streak',
        value: milestone,
        unit: 'days',
        description: `${milestone}-day calorie target streak`,
        achievedDate: new Date(),
        category: 'consistency'
      });
    }
  }
  
  // Workout consistency milestones
  const workoutFreq = await WorkoutLog.getWorkoutFrequency(userId, 30);
  if (workoutFreq.totalWorkouts >= 12) {
    milestones.push({
      type: 'workout_consistency',
      value: workoutFreq.totalWorkouts,
      unit: 'workouts',
      description: `Completed ${workoutFreq.totalWorkouts} workouts in 30 days`,
      achievedDate: new Date(),
      category: 'consistency'
    });
  }
  
  // Total workouts milestone
  const allWorkouts = await WorkoutLog.find({ userId });
  const totalWorkoutMilestones = [10, 25, 50, 100, 200, 500];
  for (const milestone of totalWorkoutMilestones) {
    if (allWorkouts.length >= milestone) {
      milestones.push({
        type: 'total_workouts',
        value: milestone,
        unit: 'workouts',
        description: `Completed ${milestone} total workouts`,
        achievedDate: new Date(),
        category: 'achievement'
      });
    }
  }
  
  // Personal records milestone
  const prCount = allWorkouts.reduce((count, workout) => {
    return count + workout.exercises.filter(ex => ex.personalRecord).length;
  }, 0);
  
  if (prCount > 0) {
    milestones.push({
      type: 'personal_records',
      value: prCount,
      unit: 'PRs',
      description: `Set ${prCount} personal record${prCount > 1 ? 's' : ''}`,
      achievedDate: new Date(),
      category: 'achievement'
    });
  }
  
  // Days tracked milestone
  const uniqueDates = new Set([
    ...allStats.map(s => s.date.toDateString()),
    ...allWorkouts.map(w => w.date.toDateString())
  ]);
  
  const daysTrackedMilestones = [7, 14, 30, 60, 90, 180, 365];
  for (const milestone of daysTrackedMilestones) {
    if (uniqueDates.size >= milestone) {
      milestones.push({
        type: 'days_tracked',
        value: milestone,
        unit: 'days',
        description: `Tracked progress for ${milestone} days`,
        achievedDate: new Date(),
        category: 'consistency'
      });
    }
  }
  
  // Remove duplicates and sort by value descending
  const uniqueMilestones = Array.from(
    new Map(milestones.map(m => [`${m.type}-${m.value}`, m])).values()
  );
  
  return uniqueMilestones.sort((a, b) => b.value - a.value);
}

/**
 * Detect concerning patterns in user progress
 * @param {string} userId - User ID
 * @returns {Array} Array of concerning pattern objects
 */
export async function detectConcerningPatterns(userId) {
  const concerns = [];
  
  // Check for rapid weight loss
  const weeklyTrend = await calculateWeightTrend(userId, 'weekly');
  if (weeklyTrend.trend === 'rapid_loss') {
    concerns.push({
      type: 'rapid_weight_loss',
      severity: 'high',
      description: `Losing weight rapidly (${Math.abs(weeklyTrend.changePerWeek)}kg/week)`,
      recommendation: 'Increase calorie intake and consult with a healthcare professional',
      detectedDate: new Date(),
      data: {
        changePerWeek: weeklyTrend.changePerWeek,
        currentWeight: weeklyTrend.endWeight
      }
    });
  }
  
  // Check for weight stagnation (no gain in 14 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentStats = await BodyStats.getStatsInRange(userId, twoWeeksAgo, new Date());
  
  if (recentStats.length >= 3) {
    const sortedStats = recentStats.sort((a, b) => a.date - b.date);
    const weightChange = sortedStats[sortedStats.length - 1].weight - sortedStats[0].weight;
    
    if (Math.abs(weightChange) < 0.2) {
      concerns.push({
        type: 'weight_stagnation',
        severity: 'medium',
        description: 'No weight gain in the last 14 days',
        recommendation: 'Consider increasing daily calorie intake by 100-150 calories',
        detectedDate: new Date(),
        data: {
          days: 14,
          weightChange: Math.round(weightChange * 10) / 10
        }
      });
    }
  }
  
  // Check for missed calorie targets
  const calorieMetrics = await calculateCalorieMetrics(userId);
  if (calorieMetrics.targetMetPercentage < 50 && calorieMetrics.daysLogged >= 7) {
    concerns.push({
      type: 'missed_calorie_targets',
      severity: 'medium',
      description: `Only meeting calorie targets ${calorieMetrics.targetMetPercentage}% of the time`,
      recommendation: 'Focus on meal planning and preparation to hit daily calorie goals',
      detectedDate: new Date(),
      data: {
        targetMetPercentage: calorieMetrics.targetMetPercentage,
        daysLogged: calorieMetrics.daysLogged
      }
    });
  }
  
  // Check for low consistency
  if (calorieMetrics.consistencyPercentage < 60 && calorieMetrics.daysLogged >= 5) {
    concerns.push({
      type: 'low_tracking_consistency',
      severity: 'low',
      description: `Only logging ${calorieMetrics.consistencyPercentage}% of days`,
      recommendation: 'Set daily reminders to log meals and track progress consistently',
      detectedDate: new Date(),
      data: {
        consistencyPercentage: calorieMetrics.consistencyPercentage
      }
    });
  }
  
  // Check for overtraining
  const recentWorkouts = await WorkoutLog.find({
    userId,
    date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).sort({ date: -1 });
  
  if (recentWorkouts.length > 6) {
    concerns.push({
      type: 'potential_overtraining',
      severity: 'high',
      description: `${recentWorkouts.length} workouts in the last 7 days`,
      recommendation: 'Consider adding rest days to allow for proper recovery',
      detectedDate: new Date(),
      data: {
        workoutsLastWeek: recentWorkouts.length
      }
    });
  }
  
  // Check for consecutive high-intensity workouts
  if (recentWorkouts.length >= 3) {
    const lastThree = recentWorkouts.slice(0, 3);
    const allHighIntensity = lastThree.every(w => w.intensity === 'high');
    
    if (allHighIntensity) {
      concerns.push({
        type: 'consecutive_high_intensity',
        severity: 'medium',
        description: 'Three consecutive high-intensity workouts detected',
        recommendation: 'Include moderate or light intensity sessions for recovery',
        detectedDate: new Date(),
        data: {
          consecutiveDays: 3
        }
      });
    }
  }
  
  // Check for lack of workout variety
  const last10Workouts = await WorkoutLog.find({ userId })
    .sort({ date: -1 })
    .limit(10);
  
  if (last10Workouts.length >= 10) {
    const uniquePlans = new Set(last10Workouts.map(w => w.workoutPlan));
    if (uniquePlans.size === 1) {
      concerns.push({
        type: 'lack_of_variety',
        severity: 'low',
        description: 'Using the same workout plan for all recent sessions',
        recommendation: 'Consider varying your workout routine for better overall development',
        detectedDate: new Date(),
        data: {
          workoutPlan: Array.from(uniquePlans)[0]
        }
      });
    }
  }
  
  return concerns.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Generate comprehensive progress report
 * @param {string} userId - User ID
 * @param {string} period - 'weekly' or 'monthly'
 * @returns {Object} Complete progress report
 */
export async function generateProgressReport(userId, period = 'monthly') {
  const [
    weightTrend,
    calorieMetrics,
    milestones,
    concerns
  ] = await Promise.all([
    calculateWeightTrend(userId, period),
    calculateCalorieMetrics(userId),
    detectMilestones(userId),
    detectConcerningPatterns(userId)
  ]);
  
  // Get workout statistics
  const days = period === 'weekly' ? 7 : 30;
  const workoutFreq = await WorkoutLog.getWorkoutFrequency(userId, days);
  
  // Get adaptation history
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const adaptations = await AdaptationLog.getAdaptationsInRange(userId, startDate, new Date());
  
  // Calculate overall progress score (0-100)
  let progressScore = 0;
  
  // Weight progress (30 points)
  if (weightTrend.trend === 'gaining') progressScore += 30;
  else if (weightTrend.trend === 'stable') progressScore += 15;
  
  // Calorie consistency (25 points)
  progressScore += Math.round(calorieMetrics.consistencyPercentage * 0.25);
  
  // Target met (25 points)
  progressScore += Math.round(calorieMetrics.targetMetPercentage * 0.25);
  
  // Workout consistency (20 points)
  if (workoutFreq.averagePerWeek >= 4) progressScore += 20;
  else if (workoutFreq.averagePerWeek >= 3) progressScore += 15;
  else if (workoutFreq.averagePerWeek >= 2) progressScore += 10;
  
  // Deduct for concerns
  const highSeverityConcerns = concerns.filter(c => c.severity === 'high').length;
  progressScore -= highSeverityConcerns * 10;
  progressScore = Math.max(0, Math.min(100, progressScore));
  
  return {
    period,
    generatedAt: new Date(),
    progressScore,
    weightProgress: weightTrend,
    nutritionMetrics: calorieMetrics,
    workoutMetrics: {
      totalWorkouts: workoutFreq.totalWorkouts,
      averagePerWeek: workoutFreq.averagePerWeek,
      period: `${days} days`
    },
    milestones: milestones.slice(0, 10), // Top 10 milestones
    concerns,
    adaptations: adaptations.map(a => a.getSummary()),
    summary: generateSummaryText(progressScore, weightTrend, calorieMetrics, concerns)
  };
}

/**
 * Generate human-readable summary text
 * @private
 */
function generateSummaryText(score, weightTrend, calorieMetrics, concerns) {
  let summary = '';
  
  // Overall assessment
  if (score >= 80) {
    summary += 'Excellent progress! You are on track with your weight gain goals. ';
  } else if (score >= 60) {
    summary += 'Good progress overall with some areas for improvement. ';
  } else if (score >= 40) {
    summary += 'Moderate progress. Focus on consistency to see better results. ';
  } else {
    summary += 'Progress needs attention. Review your plan and make necessary adjustments. ';
  }
  
  // Weight trend
  if (weightTrend.trend === 'gaining') {
    summary += `You've gained ${weightTrend.weightChange}kg over the ${weightTrend.timeframe} period. `;
  } else if (weightTrend.trend === 'stable') {
    summary += 'Your weight has remained stable. Consider increasing calorie intake. ';
  } else if (weightTrend.trend === 'losing') {
    summary += 'You are losing weight. Increase your daily calories immediately. ';
  }
  
  // Calorie consistency
  if (calorieMetrics.targetMetPercentage >= 80) {
    summary += 'Great job hitting your calorie targets consistently! ';
  } else if (calorieMetrics.targetMetPercentage >= 60) {
    summary += 'You are meeting your calorie targets most days. Keep it up! ';
  } else {
    summary += 'Focus on meeting your daily calorie targets more consistently. ';
  }
  
  // Concerns
  if (concerns.length > 0) {
    const highPriority = concerns.filter(c => c.severity === 'high');
    if (highPriority.length > 0) {
      summary += `Important: Address ${highPriority.length} high-priority concern${highPriority.length > 1 ? 's' : ''}.`;
    }
  }
  
  return summary.trim();
}

/**
 * Log daily stats (convenience method)
 * @param {string} userId - User ID
 * @param {Object} data - Daily stats data
 * @returns {Object} Logged data summary
 */
export async function logDailyStats(userId, data) {
  const results = {};
  
  // Log weight if provided
  if (data.weight) {
    const bodyStats = new BodyStats({
      userId,
      weight: data.weight,
      bodyFat: data.bodyFat,
      measurements: data.measurements,
      notes: data.notes,
      date: data.date || new Date()
    });
    results.bodyStats = await bodyStats.save();
  }
  
  // Log calories if provided
  if (data.calories) {
    results.calorieLog = data.calories;
  }
  
  // Log workout if provided
  if (data.workout) {
    results.workoutLog = data.workout;
  }
  
  return results;
}

/**
 * Get workout metrics for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze (default 30)
 * @returns {Object} Workout metrics
 */
export async function getWorkoutMetrics(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const workouts = await WorkoutLog.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
  
  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      averagePerWeek: 0,
      totalVolume: 0,
      averageIntensity: 'none',
      period: `${days} days`
    };
  }
  
  // Calculate total volume
  const totalVolume = workouts.reduce((sum, workout) => {
    return sum + workout.exercises.reduce((exSum, exercise) => {
      return exSum + (exercise.totalVolume || 0);
    }, 0);
  }, 0);
  
  // Calculate average intensity
  const intensityMap = { light: 1, moderate: 2, high: 3 };
  const avgIntensityValue = workouts.reduce((sum, w) => sum + (intensityMap[w.intensity] || 2), 0) / workouts.length;
  const averageIntensity = avgIntensityValue < 1.5 ? 'light' : avgIntensityValue < 2.5 ? 'moderate' : 'high';
  
  // Calculate average per week
  const averagePerWeek = Math.round((workouts.length / days) * 7 * 10) / 10;
  
  return {
    totalWorkouts: workouts.length,
    averagePerWeek,
    totalVolume: Math.round(totalVolume),
    averageIntensity,
    period: `${days} days`,
    recentWorkouts: workouts.slice(0, 5).map(w => ({
      date: w.date,
      workoutPlan: w.workoutPlan,
      duration: w.duration,
      intensity: w.intensity,
      exerciseCount: w.exercises.length
    }))
  };
}

export default {
  calculateWeightTrend,
  calculateCalorieMetrics,
  detectMilestones,
  detectConcerningPatterns,
  generateProgressReport,
  logDailyStats,
  getWorkoutMetrics
};
