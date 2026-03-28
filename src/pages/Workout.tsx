import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workoutApi } from '@/api/endpoints/workout';
import { useDashboard } from '@/hooks/useDashboard';
import { WorkoutLogger } from '@/components/features/WorkoutLogger';
import { useLogWorkoutMutation } from '@/hooks/useWorkoutLogging';
import { WorkoutLogData, WorkoutLog } from '@/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function Workout() {
  const [weekStart] = useState(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    return start.toISOString().split('T')[0];
  });

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useDashboard();

  // Fetch weekly workout logs
  const {
    data: workoutLogs = [],
    isLoading: isWorkoutLogsLoading,
    error: workoutLogsError,
  } = useQuery({
    queryKey: ['workoutLogs', 'weekly', weekStart],
    queryFn: async () => {
      // Check for guest mode
      const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';
      if (isGuestMode) {
        const guestLogs = localStorage.getItem('smartgain_guest_workouts');
        return guestLogs ? JSON.parse(guestLogs) : [];
      }
      
      // Get logs from the start of the week
      const response = await workoutApi.getWorkoutLogs(weekStart);
      return response;
    },
  });

  // Workout logging mutation
  const { mutateAsync: logWorkout, isPending: isLoggingWorkout } = useLogWorkoutMutation();

  const handleSubmit = async (data: WorkoutLogData) => {
    // Add timestamp to the workout log data
    const workoutDataWithTimestamp: WorkoutLogData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    await logWorkout(workoutDataWithTimestamp);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workout Tracking</h1>
          <p className="text-gray-600">Log your workouts and monitor fitness progress</p>
        </div>
      </div>

      {/* Error States */}
      {dashboardError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load dashboard data. Please try again.</AlertDescription>
        </Alert>
      )}

      {workoutLogsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load workout logs. Please try again.</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WorkoutLogger Component - Takes up 2 columns on larger screens */}
        <div className="lg:col-span-2">
          <WorkoutLogger
            weeklyWorkouts={workoutLogs}
            isLoadingWorkouts={isWorkoutLogsLoading}
            isLoading={isLoggingWorkout}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Weekly Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This Week's Stats</CardTitle>
              <CardDescription>Since {new Date(weekStart).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Total Workouts</p>
                  <p className="text-3xl font-bold">{workoutLogs.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-3xl font-bold">
                    {workoutLogs.reduce((sum, w) => sum + (w.duration || 0), 0)}
                    <span className="text-lg text-gray-500 ml-1">min</span>
                  </p>
                </div>
              </div>

              {/* Intensity Distribution */}
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-semibold text-sm">Intensity Breakdown</h4>
                <div className="space-y-2">
                  {['low', 'moderate', 'high'].map((intensity) => {
                    const count = workoutLogs.filter(w => w.intensity === intensity).length;
                    return (
                      <div key={intensity} className="flex justify-between items-center">
                        <span className="text-sm capitalize text-gray-600">{intensity}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
