import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/api/endpoints/nutrition';
import { dashboardApi } from '@/api/endpoints/dashboard';
import { MealLogData, MealLog } from '@/api/types';
import { showMutationSuccess, showMutationError } from '@/lib/toast';
import { logError } from '@/lib/errorLogger';

/**
 * Hook for logging meals with optimistic updates
 */
export function useLogMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MealLogData) => {
      return await nutritionApi.logMeal(data);
    },
    onMutate: async (newData: MealLogData) => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({ queryKey: ['mealLogs'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      // Snapshot the previous value
      const previousMealLogs = queryClient.getQueryData<MealLog[]>(['mealLogs']);
      const previousDashboard = queryClient.getQueryData(['dashboard']);

      // Optimistically update meal logs
      const optimisticMealLog: MealLog = {
        id: `temp-${Date.now()}`,
        userId: '', // Will be provided by server
        ...newData,
        createdAt: new Date().toISOString(),
      };

      if (previousMealLogs) {
        queryClient.setQueryData(['mealLogs'], [
          ...previousMealLogs,
          optimisticMealLog,
        ]);
      }

      // Optionally, optimistically update dashboard totals
      if (previousDashboard) {
        queryClient.setQueryData(['dashboard'], {
          ...previousDashboard,
          todayStats: {
            ...previousDashboard.todayStats,
            caloriesConsumed:
              (previousDashboard.todayStats?.caloriesConsumed || 0) +
              newData.calories,
          },
        });
      }

      return { previousMealLogs, previousDashboard };
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['mealLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Show success toast
      showMutationSuccess('log meal', 'Your meal has been logged successfully.');
    },
    onError: (error, _newData, context) => {
      // Rollback to previous state
      if (context?.previousMealLogs) {
        queryClient.setQueryData(['mealLogs'], context.previousMealLogs);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard'], context.previousDashboard);
      }
      
      // Log error and show toast
      logError(error, 'Meal Logging');
      showMutationError('log meal', error);
    },
  });
}
