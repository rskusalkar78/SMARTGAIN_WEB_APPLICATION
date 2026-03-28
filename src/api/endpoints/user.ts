// SmartGain Frontend - User/Profile API Endpoints

import client from '../client';
import { User, UpdateProfileData } from '../types';

/**
 * User/Profile API endpoints
 */
export const userApi = {
  /**
   * Get current user profile
   * @returns Current user data
   */
  getProfile: async (): Promise<User> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const planDataStr = localStorage.getItem('smartgain_active_plan');
      if (!planDataStr) throw new Error('No active user profile. Please calculate a plan first.');
      const planData = JSON.parse(planDataStr);
      const { userData, results } = planData;
      
      return {
        id: 'guest',
        name: userData.name || 'Guest User',
        email: userData.email || 'guest@smartgain.app',
        goals: {
          currentWeight: userData.currentWeight || 0,
          targetWeight: userData.currentWeight + userData.targetWeightGain || 0,
          weeklyGainGoal: results.weeklyGain || 0,
          dailyCalories: results.dailyCalories || 0,
          dailyProtein: results.protein || 0,
          dailyCarbs: results.carbs || 0,
          dailyFats: results.fats || 0,
        },
        preferences: {
          activityLevel: userData.activityLevel || 'moderate',
          measurementUnit: 'metric',
          dietaryRestrictions: [],
        },
        createdAt: planData.startDate || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
    }
    return client.get<User>('/user/profile');
  },

  /**
   * Update user profile
   * @param data - Profile update data (goals, preferences, etc.)
   * @returns Updated user data
   */
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const planDataStr = localStorage.getItem('smartgain_active_plan');
      if (planDataStr) {
         const planData = JSON.parse(planDataStr);
         if (data.name) planData.userData.name = data.name;
         if (data.email) planData.userData.email = data.email;
         if (data.goals?.currentWeight) planData.userData.currentWeight = data.goals.currentWeight;
         if (data.goals?.targetWeight) planData.userData.targetWeightGain = data.goals.targetWeight - planData.userData.currentWeight;
         if (data.preferences?.activityLevel) planData.userData.activityLevel = data.preferences.activityLevel;
         localStorage.setItem('smartgain_active_plan', JSON.stringify(planData));
      }
      return userApi.getProfile();
    }
    return client.put<User>('/user/profile', data);
  },
};
