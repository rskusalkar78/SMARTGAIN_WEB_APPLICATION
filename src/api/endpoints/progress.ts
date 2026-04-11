// SmartGain Frontend - Progress Tracking API Endpoints

import client from '../client';
import {
  WeightLogData,
  WeightLog,
  DateRangeParams,
} from '../types';

/**
 * Progress tracking API endpoints
 */
export const progressApi = {
  /**
   * Log body weight and measurements
   * @param data - Weight log data with optional body measurements
   * @returns Created weight log with ID
   */
  logWeight: (data: WeightLogData): Promise<WeightLog> => {
    return client.post<WeightLog>('/progress/weight', data);
  },

  /**
   * Get weight logs for a specific time range
   * @param params - Optional date range or preset range (7d, 30d, 90d, all)
   * @returns Array of weight logs
   */
  getWeightLogs: async (params?: DateRangeParams): Promise<WeightLog[]> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) {
      const raw = localStorage.getItem('smartgain_weight_logs');
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as WeightLog[]) : [];
      } catch (e) {
        return [];
      }
    }

    const response = await client.get<WeightLog[]>('/progress/weight', {
      params,
    });
    return response;
  },

  /**
   * Get the latest weight log
   * @returns Most recent weight log
   */
  getLatestWeight: async (): Promise<WeightLog> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) {
      const logs = await progressApi.getWeightLogs();
      if (logs.length === 0) {
        // Return dummy starting weight for guest if none logged
        const planStr = localStorage.getItem('smartgain_active_plan');
        const startWeight = planStr ? JSON.parse(planStr).userData?.currentWeight : 70;
        return { 
          id: 'guest-start', 
          weight: startWeight, 
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        } as WeightLog;
      }
      return logs[logs.length - 1];
    }
    const response = await client.get<WeightLog>('/progress/weight/latest');
    return response;
  },
};
