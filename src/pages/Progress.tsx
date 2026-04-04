import React, { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { progressApi } from '@/api/endpoints/progress';
import { nutritionApi } from '@/api/endpoints/nutrition';
import { workoutApi } from '@/api/endpoints/workout';
import { MeasurementLogger } from '@/components/features/MeasurementLogger';
import { useLogMeasurementMutation } from '@/hooks/useMeasurementLogging';
import { WeightLogData, DateRangeParams } from '@/api/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Flame, Dumbbell, Target, Calendar, Award } from 'lucide-react';
import { TimeRangeSelector, TimeRange } from '@/components/features/TimeRangeSelector';

// Lazy load heavy charting components
const WeightChart = React.lazy(() => import('@/components/features/charts/WeightChart').then(m => ({ default: m.WeightChart })));
const CalorieChart = React.lazy(() => import('@/components/features/charts/CalorieChart').then(m => ({ default: m.CalorieChart })));
const WorkoutChart = React.lazy(() => import('@/components/features/charts/WorkoutChart').then(m => ({ default: m.WorkoutChart })));
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export function Progress() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Load plan and all real logged data synchronously (lazy initializer prevents null on first render)
  const [activePlan] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('smartgain_active_plan');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });


  // Calculate start date based on time range
  const getDateRangeParams = (range: TimeRange): DateRangeParams => {
    if (range === 'all') return { range: 'all' };
    return { range };
  };

  const dateParams = getDateRangeParams(timeRange);

  // Fetch weight logs (fallback to API if available)
  const {
    data: weightLogs,
    isLoading: isLoadingWeight
  } = useQuery({
    queryKey: ['weightLogs', timeRange],
    queryFn: () => progressApi.getWeightLogs(dateParams),
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch meal logs
  const {
    data: mealLogs,
    isLoading: isLoadingMeals
  } = useQuery({
    queryKey: ['mealLogs', timeRange],
    queryFn: () => nutritionApi.getMealLogs(dateParams),
    staleTime: 1000 * 60,
  });

  // Fetch workout logs
  const {
    data: workoutLogs,
    isLoading: isLoadingWorkouts
  } = useQuery({
    queryKey: ['workoutLogs', timeRange],
    queryFn: () => workoutApi.getWorkoutLogs(dateParams),
    staleTime: 1000 * 60,
  });

  // Fetch workout plan for completion rate calculation
  const {
    data: workoutPlan,
    isLoading: isLoadingWorkoutPlan
  } = useQuery({
    queryKey: ['workoutPlan'],
    queryFn: () => workoutApi.getWorkoutPlan(),
    retry: false,
  });

  // Fetch latest weight for comparison (for the logger)
  const {
    data: previousMeasurement,
    isLoading: isLoadingPrevious,
    error: previousError,
  } = useQuery({
    queryKey: ['latestWeight'],
    queryFn: async () => {
      const response = await progressApi.getLatestWeight();
      return response;
    },
  });

  // Measurement logging mutation
  const { mutateAsync: logMeasurement, isPending: isLoggingMeasurement } = useLogMeasurementMutation();

  const handleSubmit = async (data: Record<string, any>) => {
    // Convert form data to WeightLogData format
    const measurementData: WeightLogData = {
      weight: data.weight,
      bodyFat: data.bodyFat || undefined,
      measurements: data.chest || data.waist || data.hips || data.leftArm || data.rightArm || data.leftThigh || data.rightThigh
        ? {
          chest: data.chest || undefined,
          waist: data.waist || undefined,
          hips: data.hips || undefined,
          leftArm: data.leftArm || undefined,
          rightArm: data.rightArm || undefined,
          leftThigh: data.leftThigh || undefined,
          rightThigh: data.rightThigh || undefined,
        }
        : undefined,
      timestamp: new Date().toISOString(),
    };

    // Always use the mutation so React Query handles state updates correctly
    await logMeasurement(measurementData);
  };

  const displayWeightLogs: any[] = Array.isArray(weightLogs) ? weightLogs : [];
 
  // Normalize meal logs — ensure every log has a timestamp
  const displayMealLogs: any[] = (Array.isArray(mealLogs) ? mealLogs : []).map((m: any) => ({
    ...m,
    timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
  }));
 
  // Normalize workout logs — ensure every log has a timestamp
  const displayWorkoutLogs: any[] = (Array.isArray(workoutLogs) ? workoutLogs : []).map((w: any) => ({
    ...w,
    timestamp: w.timestamp || (w.date ? w.date + 'T00:00:00.000Z' : new Date().toISOString()),
  }));

  const displayWorkoutPlan = activePlan ? activePlan.workoutPlan : workoutPlan;

  // Calculate progress metrics — use safe optional chaining throughout
  const startingWeight = activePlan?.userData?.currentWeight || 0;
  const targetWeightGoal = activePlan?.userData?.targetWeight || 0;
  // Weight gain goal = how much they want to gain total
  const totalWeightGainGoal = Math.max(0.1, targetWeightGoal - startingWeight);

  const currentWeight = displayWeightLogs.length > 0
    ? displayWeightLogs[displayWeightLogs.length - 1].weight
    : startingWeight;

  const weightGained = Math.max(0, currentWeight - startingWeight);

  const progressPercentage = totalWeightGainGoal > 0
    ? Math.min(100, (weightGained / totalWeightGainGoal) * 100)
    : 0;

  const daysSinceStart = activePlan?.startDate
    ? Math.max(0, differenceInDays(new Date(), new Date(activePlan.startDate)))
    : 0;

  const totalPlanDays = (activePlan?.userData?.timeframe || 12) * 7;
  const dailyCaloriesTarget = activePlan?.results?.dailyCalories || user?.goals?.dailyCalories || 2500;

  // --- New Weekly Performance Calculations ---
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // Sunday
  
  const weeklyWorkouts = displayWorkoutLogs.filter(w => {
    const d = parseISO(w.timestamp);
    return isWithinInterval(d, { start: currentWeekStart, end: currentWeekEnd });
  });
  
  const plannedWorkoutsPerWeek = activePlan?.workoutPlan?.daysPerWeek || user?.goals?.weeklyGainGoal ? 4 : 3;
  const sessionsLabel = `${weeklyWorkouts.length} of ${plannedWorkoutsPerWeek} sessions`;

  const weekDayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDays = weekDayNames.map((name, i) => {
    const day = addDays(currentWeekStart, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const hasWorkout = weeklyWorkouts.some(w => format(parseISO(w.timestamp), 'yyyy-MM-dd') === dateStr);
    return { name, dateStr, hasWorkout };
  });

  const nutritionWeekDays = weekDayNames.map((name, i) => {
    const day = addDays(currentWeekStart, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailySum = displayMealLogs
      .filter(m => format(parseISO(m.timestamp), 'yyyy-MM-dd') === dateStr)
      .reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
    const isGoalMet = dailySum >= dailyCaloriesTarget * 0.9;
    return { name, dateStr, dailySum, isGoalMet };
  });

  const avgCaloriesThisWeek = displayMealLogs.filter(m => {
    const d = parseISO(m.timestamp);
    return isWithinInterval(d, { start: currentWeekStart, end: currentWeekEnd });
  }).reduce((acc: number, m: any) => acc + (m.calories || 0), 0) / (Math.max(1, differenceInDays(new Date(), currentWeekStart) + 1));

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Progress Tracking</h1>
          <p className="text-gray-600">Monitor your weight, nutrition, and workouts over time</p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats Overview Cards */}
      {activePlan && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Weight Progress Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weight Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weightGained.toFixed(1)} kg</div>
              <p className="text-xs text-muted-foreground">
                of {totalWeightGainGoal.toFixed(1)} kg goal
              </p>
              <ProgressBar value={progressPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {progressPercentage.toFixed(0)}% complete
              </p>
            </CardContent>
          </Card>

          {/* Workout Performance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workout Performance</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionsLabel}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed this week
              </p>
              <div className="flex justify-between mt-4">
                {weekDays.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">{day.name}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all
                      ${day.hasWorkout 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-muted/30 text-muted-foreground border border-dashed border-muted'}`}
                    >
                      {day.hasWorkout ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Performance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nutrition Performance</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgCaloriesThisWeek).toLocaleString()} kcal</div>
              <p className="text-xs text-muted-foreground mt-1">
                Daily average this week
              </p>
              <div className="flex justify-between mt-4">
                {nutritionWeekDays.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">{day.name}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all
                      ${day.isGoalMet 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'bg-muted/30 text-muted-foreground border border-dashed border-muted'}`}
                    >
                      {day.isGoalMet ? '🔥' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Days Active Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Active</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{daysSinceStart}</div>
              <p className="text-xs text-muted-foreground">
                of {totalPlanDays} days
              </p>
              <ProgressBar 
                value={(daysSinceStart / totalPlanDays) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
        </div>
      )}


      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
        </TabsList>

        <Suspense fallback={<div className="h-[400px] w-full flex items-center justify-center bg-muted/20 animate-pulse rounded-xl"><p className="text-muted-foreground animate-pulse">Loading charts...</p></div>}>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WeightChart data={displayWeightLogs} isLoading={isLoadingWeight && !activePlan} />
              <CalorieChart
                data={displayMealLogs}
                calorieTarget={(activePlan?.results?.dailyCalories) || user?.goals?.dailyCalories || 2500}
                isLoading={isLoadingMeals && !activePlan}
              />
            </div>
            <WorkoutChart 
              data={displayWorkoutLogs} 
              workoutPlan={displayWorkoutPlan}
              isLoading={(isLoadingWorkouts || isLoadingWorkoutPlan) && !activePlan} 
            />
          </TabsContent>

          <TabsContent value="weight">
            <WeightChart data={displayWeightLogs} isLoading={isLoadingWeight && !activePlan} />
          </TabsContent>

          <TabsContent value="nutrition">
            <CalorieChart
              data={displayMealLogs}
              calorieTarget={activePlan?.results.dailyCalories || user?.goals?.dailyCalories || 2500}
              isLoading={isLoadingMeals && !activePlan}
            />
          </TabsContent>

          <TabsContent value="workouts">
            <WorkoutChart 
              data={displayWorkoutLogs} 
              workoutPlan={displayWorkoutPlan}
              isLoading={(isLoadingWorkouts || isLoadingWorkoutPlan) && !activePlan} 
            />
          </TabsContent>
        </Suspense>
      </Tabs>

      {/* Measurement Logger Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Log Measurements</h2>

        {/* Error States */}
        {previousError && !activePlan && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load previous measurement. This is optional - you can still log your measurement.</AlertDescription>
          </Alert>
        )}

        <MeasurementLogger
          previousMeasurement={activePlan ? (displayWeightLogs?.[displayWeightLogs.length - 1]) : previousMeasurement}
          isLoadingPrevious={isLoadingPrevious}
          isLoading={isLoggingMeasurement}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default Progress;
