import progressTracker from '../services/progress/progressTracker.js';

class ProgressController {
  /**
   * Get progress analytics for user
   * GET /api/v1/progress/analytics
   */
  async getAnalytics(req, res) {
    try {
      const userId = req.userId;
      const period = req.query.period || 'monthly'; // weekly or monthly
      
      // Validate period
      if (!['weekly', 'monthly'].includes(period)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PERIOD',
            message: 'Period must be either "weekly" or "monthly"',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Generate progress report
      const progressReport = await progressTracker.generateProgressReport(userId, period);
      
      res.status(200).json({
        success: true,
        data: progressReport,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export default new ProgressController();
