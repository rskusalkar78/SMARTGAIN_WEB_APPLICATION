import User from '../models/User.js';
import progressTracker from '../services/progress/progressTracker.js';
import { performAdaptiveAnalysis } from '../services/integration/adaptiveIntegration.js';

class DashboardController {
  /**
   * Get dashboard summary with current stats and recommendations
   * GET /api/v1/dashboard/summary
   */
  async getSummary(req, res) {
    try {
      const userId = req.userId;
      
      // Fetch user data
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Get progress metrics
      const [weightTrend, calorieMetrics, milestones, concerns] = await Promise.all([
        progressTracker.calculateWeightTrend(userId, 'weekly'),
        progressTracker.calculateCalorieMetrics(userId),
        progressTracker.detectMilestones(userId),
        progressTracker.detectConcerningPatterns(userId)
      ]);
      
      // Build summary response
      const summary = {
        user: {
          name: user.profile.name,
          currentWeight: user.profile.currentWeight,
          targetWeight: user.profile.targetWeight,
          weeklyWeightGain: user.goals.weeklyWeightGain
        },
        calculations: {
          bmr: user.calculations.bmr,
          tdee: user.calculations.tdee,
          targetCalories: user.calculations.targetCalories,
          macroTargets: user.calculations.macroTargets
        },
        progress: {
          weightTrend,
          calorieMetrics,
          recentMilestones: milestones.slice(0, 3),
          concerns: concerns.filter(c => c.severity === 'high' || c.severity === 'medium')
        },
        lastUpdated: new Date().toISOString()
      };
      
      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'DASHBOARD_FETCH_FAILED',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export default new DashboardController();
