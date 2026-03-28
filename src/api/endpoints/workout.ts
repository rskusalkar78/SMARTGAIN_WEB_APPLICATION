// SmartGain Frontend - Workout API Endpoints

import client from '../client';
import {
  WorkoutLogData,
  WorkoutLog,
  WorkoutPlan,
  DateRangeParams,
} from '../types';

/**
 * Workout API endpoints
 */
export const workoutApi = {
  /**
   * Log a workout session
   * @param data - Workout log data
   * @returns Created workout log with ID
   */
  logWorkout: (data: WorkoutLogData): Promise<WorkoutLog> => {
    return client.post<WorkoutLog>('/workout/logs', data);
  },

  /**
   * Get workout logs for a specific date or date range
   * @param params - Date filter or range parameters
   * @returns Array of workout logs
   */
  getWorkoutLogs: (params?: string | DateRangeParams): Promise<WorkoutLog[]> => {
    // Handle legacy single date string or new object params
    const queryParams = typeof params === 'string' ? { date: params } : params;

    return client.get<WorkoutLog[]>('/workout/logs', {
      params: queryParams,
    });
  },

  /**
   * Get the user's current workout plan
   * @returns Current workout plan with daily workouts
   */
  getWorkoutPlan: async (): Promise<WorkoutPlan> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const planStr = localStorage.getItem('smartgain_active_plan');
      if (!planStr) throw new Error('No active plan found. Please generate one first.');
      
      const planData = JSON.parse(planStr);
      const guestPlan = planData.workoutPlan;
      
      const rawStartDate = new Date(planData.startDate || new Date());
      
      // Calculate the most recent Monday to act as Day 1
      const dayOfWeek = rawStartDate.getDay(); // 0 = Sunday, 1 = Monday
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const alignedStartDate = new Date(rawStartDate);
      alignedStartDate.setDate(rawStartDate.getDate() - daysToSubtract);
      
      // Extract only active workout routines (strip out native rest days)
      const activeWorkouts = guestPlan.split.filter((day: any) => !day.isRestDay);
      let workoutIndex = 0;
      
      const mappedWorkouts = Array.from({ length: 7 }).map((_, i: number) => {
        const targetDate = new Date(alignedStartDate);
        targetDate.setDate(alignedStartDate.getDate() + i);
        
        // Exclusively force Sunday (index 6 in this Monday-aligned array) to be the ONLY Rest Day
        const isSunday = i === 6;
        
        let dayPlan;
        if (isSunday) {
           dayPlan = { focus: 'Recovery', isRestDay: true, exercises: [] };
        } else {
           // Cycle through active workouts
           dayPlan = activeWorkouts[workoutIndex % activeWorkouts.length];
           workoutIndex++;
        }
        
        return {
          id: `guest-workout-${i}`,
          date: targetDate.toISOString().split('T')[0],
          muscleGroup: dayPlan.focus,
          isRestDay: dayPlan.isRestDay,
          estimatedDuration: dayPlan.isRestDay ? 0 : 45,
          exercises: dayPlan.exercises?.map((ex: any) => ({
             name: ex.name,
             sets: ex.sets || 3,
             reps: ex.reps || '10-12',
             restSeconds: 60,
             notes: ex.notes || ''
          })) || []
        };
      });

      return {
        id: 'guest-plan',
        userId: 'guest',
        name: guestPlan.name,
        description: guestPlan.description,
        startDate: rawStartDate.toISOString(),
        endDate: new Date(rawStartDate.getTime() + 30*24*60*60*1000).toISOString(),
        createdAt: rawStartDate.toISOString(),
        workouts: mappedWorkouts,
      } as unknown as WorkoutPlan;
    }
    return client.get<WorkoutPlan>('/workout/plan');
  },

  /**
   * Generate a new workout plan based on user goals
   * @returns Newly generated workout plan
   */
  generateWorkoutPlan: async (): Promise<WorkoutPlan> => {
    const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
    if (isGuestMode) throw new Error('Guest users must calculate a new plan from the home dashboard to generate workouts.');
    return client.post<WorkoutPlan>('/workout/plan/generate');
  },
};
