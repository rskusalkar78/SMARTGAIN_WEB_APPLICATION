import BodyStats from '../models/BodyStats.js';
import logger from '../utils/logger.js';

class StatsController {
  /**
   * Log body stats (weight, measurements, etc.)
   * POST /api/v1/stats/body
   */
  async logBodyStats(req, res) {
    try {
      const userId = req.userId;
      const { weight, bodyFat, measurements, notes, date } = req.body;
      
      // Validate required fields
      if (!weight) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Weight is required',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Create body stats entry
      const bodyStats = new BodyStats({
        userId,
        date: date ? new Date(date) : new Date(),
        weight,
        bodyFat: bodyFat || null,
        measurements: measurements || {},
        notes: notes || ''
      });
      
      await bodyStats.save();
      
      logger.info('Body stats logged', {
        userId,
        weight,
        date: bodyStats.date
      });
      
      res.status(201).json({
        success: true,
        message: 'Body stats logged successfully',
        data: {
          bodyStats: {
            id: bodyStats._id,
            date: bodyStats.date,
            weight: bodyStats.weight,
            bodyFat: bodyStats.bodyFat,
            measurements: bodyStats.measurements
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log body stats', {
        userId: req.userId,
        error: error.message
      });
      
      let statusCode = 500;
      let errorCode = 'BODY_STATS_LOG_FAILED';
      
      if (error.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      }
      
      res.status(statusCode).json({
        error: {
          code: errorCode,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export default new StatsController();
