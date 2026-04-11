// SmartGain Frontend - Dashboard API Endpoints

import client from '../client';
import { DashboardData } from '../types';

/**
 * Dashboard API endpoints
 */
export const dashboardApi = {
  /**
   * Get comprehensive dashboard data
   * Includes user profile, today's stats, weekly progress, and upcoming workouts
   * @returns Dashboard data with all relevant information
   */
  getDashboard: (): Promise<DashboardData> => {
    return client.get<DashboardData>('/dashboard');
  },
};
