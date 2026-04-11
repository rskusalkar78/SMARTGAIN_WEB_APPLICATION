import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutApi } from '@/api/endpoints/workout';
import { dashboardApi } from '@/api/endpoints/dashboard';
import { WorkoutLogData, WorkoutLog } from '@/api/types';
import { showMutationSuccess, showMutationError } from '@/lib/toast';
import { logError } from '@/lib/errorLogger';

/**
 * Hook for logging workouts with optimistic updates
 */
export function useLogWorkoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WorkoutLogData) => {
      // Check for guest mode
      const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
      if (isGuestMode) {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const guestLogsStr = localStorage.getItem('smartgain_guest_workouts');
        const guestLogs: WorkoutLog[] = guestLogsStr ? JSON.parse(guestLogsStr) : [];
        
        const newLog: WorkoutLog = {
          id: `guest-${Date.now()}`,
          userId: 'guest',
          ...data,
          createdAt: new Date().toISOString(),
        };
        
        localStorage.setItem('smartgain_guest_workouts', JSON.stringify([...guestLogs, newLog]));
        return newLog;
      }
      
      return await workoutApi.logWorkout(data);
    },
    onMutate: async (newData: WorkoutLogData) => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({ queryKey: ['workoutLogs'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      // Snapshot the previous value
      const previousWorkoutLogs = queryClient.getQueryData<WorkoutLog[]>(['workoutLogs']);
      const previousDashboard = queryClient.getQueryData<any>(['dashboard']);

      // Optimistically update workout logs
      const optimisticWorkoutLog: WorkoutLog = {
        id: `temp-${Date.now()}`,
        userId: '', // Will be provided by server
        ...newData,
        createdAt: new Date().toISOString(),
      };

      if (previousWorkoutLogs) {
        queryClient.setQueryData(['workoutLogs'], [
          ...previousWorkoutLogs,
          optimisticWorkoutLog,
        ]);
      }

      // Optionally, optimistically update dashboard stats
      if (previousDashboard) {
        queryClient.setQueryData(['dashboard'], {
          ...previousDashboard,
          todayStats: {
            ...previousDashboard.todayStats,
            workoutsCompleted:
              (previousDashboard.todayStats?.workoutsCompleted || 0) + 1,
          },
        });
      }

      return { previousWorkoutLogs, previousDashboard };
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['workoutLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Show success toast
      showMutationSuccess('log workout', 'Your workout has been logged successfully.');
    },
    onError: (error, _newData, context) => {
      // Rollback to previous state
      if (context?.previousWorkoutLogs) {
        queryClient.setQueryData(['workoutLogs'], context.previousWorkoutLogs);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard'], context.previousDashboard);
      }
      
      // Log error and show toast
      logError(error, 'Workout Logging');
      showMutationError('log workout', error);
    },
  });
}
