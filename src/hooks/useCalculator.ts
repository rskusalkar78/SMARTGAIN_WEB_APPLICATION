// SmartGain Frontend - Calculator Hook
// Custom hook for calculator mutation with React Query

import { useMutation } from '@tanstack/react-query';
import { nutritionApi } from '@/api/endpoints/nutrition';
import { CalculatorData, CalculatorResults, ActivityLevel } from '@/api/types';
import { UserData } from '@/lib/calculations';

/**
 * Map local UserData format to API CalculatorData format
 */
function mapUserDataToCalculatorData(userData: UserData): CalculatorData {
  // Map activity level from local format to API format
  const activityLevelMap: Record<string, ActivityLevel> = {
    'sedentary': 'sedentary',
    'light': 'light',
    'moderate': 'moderate',
    'active': 'very',
    'very_active': 'extreme',
  };

  // Calculate target weight from current weight and target gain
  const targetWeight = userData.currentWeight + userData.targetWeightGain;

  // Calculate weekly gain goal from target gain and timeframe
  const weeklyGainGoal = userData.targetWeightGain / userData.timeframe;

  return {
    age: userData.age,
    gender: userData.gender,
    height: userData.height,
    currentWeight: userData.currentWeight,
    targetWeight: targetWeight,
    activityLevel: activityLevelMap[userData.activityLevel] || 'moderate',
    weeklyGainGoal: weeklyGainGoal,
    dietaryPreferences: [], // Optional field, can be added later
  };
}

/**
 * Custom hook for calculator mutation
 */
export function useCalculator() {
  return useMutation({
    mutationFn: async (userData: UserData): Promise<CalculatorResults> => {
      const calculatorData = mapUserDataToCalculatorData(userData);
      return nutritionApi.calculate(calculatorData);
    },
  });
}
