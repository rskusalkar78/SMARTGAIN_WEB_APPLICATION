// SmartGain Frontend - Nutrition API Endpoints

import client from '../client';
import {
  CalculatorData,
  CalculatorResults,
  MealLogData,
  MealLog,
  MealPlan,
  DateRangeParams,
} from '../types';

/**
 * Nutrition API endpoints
 */
export const nutritionApi = {
  /**
   * Calculate daily calorie and macro recommendations
   * @param data - User data for calculation (age, weight, activity level, etc.)
   * @returns Calculated daily calories and macros
   */
  calculate: async (data: CalculatorData): Promise<CalculatorResults> => {
    const response = await client.post<{ success: boolean; data: CalculatorResults }>('/nutrition/calculate', data);
    return response.data;
  },

  /**
   * Log a meal with calorie and macro information
   * @param data - Meal log data
   * @returns Created meal log with ID
   */
  logMeal: (data: MealLogData): Promise<MealLog> => {
    return client.post<MealLog>('/nutrition/logs', data);
  },

  /**
   * Get meal logs for a specific date or date range
   * @param params - Date filter or range parameters
   * @returns Array of meal logs
   */
  getMealLogs: async (params?: string | DateRangeParams): Promise<MealLog[]> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) {
      // In guest mode, we retrieve logs from localStorage keys
      // The keys are formatted as 'smartgain.mealLogs.YYYY-MM-DD'
      const allLogs: MealLog[] = [];
      const planStr = localStorage.getItem('smartgain_active_plan');
      
      if (planStr) {
        const planData = JSON.parse(planStr);
        const startDate = new Date(planData.startDate || new Date());
        const today = new Date();
        const diffDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Scan from plan start date to today (plus a bit of buffer)
        for (let i = 0; i <= Math.max(diffDays, 31); i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const raw = localStorage.getItem(`smartgain.mealLogs.${dateStr}`);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) allLogs.push(...parsed);
            } catch (e) { /* ignore corrupted */ }
          }
        }
      } else {
        // Fallback: just check today and yesterday if no plan
        const today = new Date().toISOString().split('T')[0];
        const rawToday = localStorage.getItem(`smartgain.mealLogs.${today}`);
        if (rawToday) allLogs.push(...(JSON.parse(rawToday) || []));
      }
      
      return allLogs;
    }

    // Handle legacy single date string or new object params
    const queryParams = typeof params === 'string' ? { date: params } : params;

    const response = await client.get<MealLog[]>('/nutrition/logs', {
      params: queryParams,
    });
    return response;
  },

  getMealPlan: async (): Promise<MealPlan> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const planStr = localStorage.getItem('smartgain_active_plan');
      if (!planStr) throw new Error('No active plan found. Please generate one from the calculator first.');
      
      const planData = JSON.parse(planStr);
      // Results might be undefined if old data shape; handle gracefully
      const results = planData.results || { dailyCalories: 2500, protein: 150, carbs: 300, fats: 80 };
      const rawStartDate = new Date(planData.startDate || new Date());
      
      const bCal = Math.round(results.dailyCalories * 0.25);
      const lCal = Math.round(results.dailyCalories * 0.35);
      const dCal = Math.round(results.dailyCalories * 0.30);
      const sCal = Math.round(results.dailyCalories * 0.10);

      const bProt = Math.round(results.protein * 0.25);
      const lProt = Math.round(results.protein * 0.35);
      const dProt = Math.round(results.protein * 0.30);
      const sProt = Math.round(results.protein * 0.10);

      const bCarb = Math.round(results.carbs * 0.25);
      const lCarb = Math.round(results.carbs * 0.35);
      const dCarb = Math.round(results.carbs * 0.30);
      const sCarb = Math.round(results.carbs * 0.10);

      const bFat = Math.round(results.fats * 0.25);
      const lFat = Math.round(results.fats * 0.35);
      const dFat = Math.round(results.fats * 0.30);
      const sFat = Math.round(results.fats * 0.10);
      
      // Map out 7 days of meals
      const dailyMealsList = Array.from({ length: 7 }).map((_, i) => {
        const targetDate = new Date(rawStartDate);
        targetDate.setDate(targetDate.getDate() + i);
        
        return {
          date: targetDate.toISOString().split('T')[0],
          breakfast: {
            name: 'Oatmeal with Protein & Berries',
            ingredients: ['1 cup rolled oats', '1 scoop whey protein', '1/2 cup berries', '1 cup milk'],
            instructions: 'Cook oats with milk, stir in protein powder, and top with fresh berries.',
            calories: bCal, protein: bProt, carbs: bCarb, fats: bFat
          },
          lunch: {
            name: 'Chicken & Sweet Potato Bowl',
            ingredients: ['200g chicken breast', '200g sweet potato', '1 cup broccoli', '1 tbsp olive oil'],
            instructions: 'Roast sweet potato and broccoli. Grill chicken. Combine in a bowl with olive oil.',
            calories: lCal, protein: lProt, carbs: lCarb, fats: lFat
          },
          dinner: {
            name: 'Salmon with Rice',
            ingredients: ['150g salmon fillet', '1.5 cups jasmine rice', 'Asparagus spears', 'Lemon juice'],
            instructions: 'Bake salmon with lemon. Steam asparagus. Serve with cooked jasmine rice.',
            calories: dCal, protein: dProt, carbs: dCarb, fats: dFat
          },
          snacks: [
            {
              name: 'Greek Yogurt & Almonds',
              ingredients: ['1 cup Greek yogurt', '30g almonds', '1 tbsp honey'],
              instructions: 'Mix honey into yogurt and top with almonds.',
              calories: sCal, protein: sProt, carbs: sCarb, fats: sFat
            }
          ]
        };
      });

      return {
        id: 'guest-meal-plan',
        userId: 'guest',
        startDate: rawStartDate.toISOString(),
        endDate: new Date(rawStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        meals: dailyMealsList,
        createdAt: rawStartDate.toISOString()
      };
    }
    return client.get<MealPlan>('/nutrition/meal-plan');
  },

  /**
   * Generate a new meal plan based on user goals
   * @returns Newly generated meal plan
   */
  generateMealPlan: async (): Promise<MealPlan> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) throw new Error('Guest users must generate a new plan from the calculators.');
    return client.post<MealPlan>('/nutrition/meal-plan/generate');
  },
};
