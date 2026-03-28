// SmartGain Frontend - Dashboard Data Hook
// React Query hook for fetching dashboard data

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { dashboardApi } from '@/api/endpoints/dashboard';
import { DashboardData } from '@/api/types';

/**
 * Query key factory for dashboard queries
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  detail: () => [...dashboardKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch dashboard data
 * Includes user profile, today's stats, weekly progress, and upcoming workouts
 * 
 * Features:
 * - Automatic refresh after 5 minutes of inactivity (Req 4.7)
 * - Background refetching on window focus (Req 12.5)
 * 
 * @returns React Query result with dashboard data
 */
export const useDashboard = () => {
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const query = useQuery<DashboardData>({
    queryKey: dashboardKeys.detail(),
    queryFn: async () => {
      // Check for guest mode
      const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
      if (isGuestMode) {
        const planDataStr = localStorage.getItem('smartgain_active_plan');
        if (planDataStr) {
          try {
            const planData = JSON.parse(planDataStr);
            const { userData, results, workoutPlan } = planData;
            
            const weightLogsStr = localStorage.getItem('smartgain_weight_logs');
            const weightLogs = weightLogsStr ? JSON.parse(weightLogsStr) : [];
            const weeklyProgress = weightLogs.length > 0 ? weightLogs : [
              {
                id: 'initial',
                userId: 'guest',
                weight: userData?.currentWeight || 0,
                timestamp: planData.startDate || new Date().toISOString(),
                createdAt: planData.startDate || new Date().toISOString(),
              }
            ];
            
            return {
              user: {
                id: 'guest',
                name: 'Guest User',
                email: 'guest@smartgain.app',
                goals: {
                  currentWeight: userData?.currentWeight || 0,
                  targetWeight: (userData?.currentWeight || 0) + (userData?.targetWeightGain || 0),
                  weeklyGainGoal: results?.weeklyGain || 0,
                  dailyCalories: results?.dailyCalories || 0,
                  dailyProtein: results?.protein || 0,
                  dailyCarbs: results?.carbs || 0,
                  dailyFats: results?.fats || 0,
                },
                preferences: {
                  activityLevel: userData?.activityLevel || 'moderate',
                  dietaryRestrictions: [],
                  measurementUnit: 'metric',
                },
                createdAt: planData.startDate || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              todayStats: {
                caloriesConsumed: 0,
                caloriesTarget: results?.dailyCalories || 2500,
                proteinConsumed: 0,
                proteinTarget: results?.protein || 150,
                mealsLogged: 0,
                workoutsCompleted: 0,
              },
              weeklyProgress,
              upcomingWorkouts: workoutPlan?.split
                ?.filter((d: any) => !d.isRestDay)
                ?.slice(0, 3)
                ?.map((d: any, i: number) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  return {
                    date: date.toISOString(),
                    muscleGroup: d.focus,
                    exercises: d.exercises || [],
                    estimatedDuration: 45
                  };
                }) || [],
            } as DashboardData;
          } catch (e) {
            console.error('Failed to parse guest plan data', e);
          }
        }
      }
      
      // If not guest mode, fetch from API
      return dashboardApi.getDashboard();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when window regains focus (Req 12.5)
    retry: 2, // Retry failed requests twice
  });

  // Implement auto-refresh after 5 minutes of inactivity (Req 4.7)
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // If inactive for 5 minutes, refetch data
      if (timeSinceLastActivity >= 5 * 60 * 1000) {
        query.refetch();
        lastActivityRef.current = now;
      }
    };

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Check for inactivity every minute
    inactivityTimerRef.current = setInterval(checkInactivity, 60 * 1000);

    return () => {
      // Cleanup
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [query]);

  return query;
};
