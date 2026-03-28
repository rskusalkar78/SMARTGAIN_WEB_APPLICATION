import { useState, useEffect } from 'react';
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
import { WeightChart } from '@/components/features/charts/WeightChart';
import { CalorieChart } from '@/components/features/charts/CalorieChart';
import { WorkoutChart } from '@/components/features/charts/WorkoutChart';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { subDays, format, differenceInDays } from 'date-fns';

export function Progress() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activePlan, setActivePlan] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>({
    weightLogs: [],
    caloriesLogs: [],
    workoutLogs: [],
    consistency: {
      workouts: 0,
      nutrition: 0,
      overall: 0
    }
  });

  // Load active plan from localStorage
  useEffect(() => {
    const planData = localStorage.getItem('smartgain_active_plan');
    if (planData) {
      const plan = JSON.parse(planData);
      setActivePlan(plan);
      
      // Initialize tracking data with sample data for demonstration
      const startDate = new Date(plan.startDate);
      const daysSinceStart = differenceInDays(new Date(), startDate);
      
      // Generate sample weight logs
      const weightLogs = Array.from({ length: Math.min(daysSinceStart, 30) }, (_, i) => ({
        id: `weight-${i}`,
        weight: plan.userData.currentWeight + (i * 0.1),
        timestamp: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
        createdAt: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd')
      }));

      // Generate sample calorie logs
      const caloriesLogs = Array.from({ length: Math.min(daysSinceStart, 30) }, (_, i) => ({
        date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
        calories: plan.results.dailyCalories + (Math.random() * 200 - 100),
        target: plan.results.dailyCalories
      }));

      // Generate sample workout logs
      const workoutLogs = Array.from({ length: Math.min(daysSinceStart, 20) }, (_, i) => ({
        id: `workout-${i}`,
        date: format(subDays(new Date(), 30 - i * 1.5), 'yyyy-MM-dd'),
        workoutType: plan.workoutPlan.split[i % plan.workoutPlan.split.length].focus,
        duration: 45 + Math.random() * 30,
        completed: true
      }));

      setTrackingData({
        weightLogs,
        caloriesLogs,
        workoutLogs,
        consistency: {
          workouts: Math.round((workoutLogs.length / (daysSinceStart || 1)) * 100),
          nutrition: Math.round(85 + Math.random() * 10),
          overall: Math.round(80 + Math.random() * 15)
        }
      });
    }
  }, []);

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
    enabled: !activePlan, // Only fetch if no active plan in localStorage
  });

  // Fetch meal logs
  const {
    data: mealLogs,
    isLoading: isLoadingMeals
  } = useQuery({
    queryKey: ['mealLogs', timeRange],
    queryFn: () => nutritionApi.getMealLogs(dateParams),
    enabled: !activePlan,
  });

  // Fetch workout logs
  const {
    data: workoutLogs,
    isLoading: isLoadingWorkouts
  } = useQuery({
    queryKey: ['workoutLogs', timeRange],
    queryFn: () => workoutApi.getWorkoutLogs(dateParams),
    enabled: !activePlan,
  });

  // Fetch workout plan for completion rate calculation
  const {
    data: workoutPlan,
    isLoading: isLoadingWorkoutPlan
  } = useQuery({
    queryKey: ['workoutPlan'],
    queryFn: () => workoutApi.getWorkoutPlan(),
    retry: false,
    enabled: !activePlan,
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
    enabled: !activePlan,
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

  // Use localStorage data if available, otherwise use API data
  const displayWeightLogs = activePlan ? trackingData.weightLogs : (weightLogs || []);
  const displayMealLogs = activePlan ? trackingData.caloriesLogs : (mealLogs || []);
  const displayWorkoutLogs = activePlan ? trackingData.workoutLogs : (workoutLogs || []);
  const displayWorkoutPlan = activePlan ? activePlan.workoutPlan : workoutPlan;

  // Calculate progress metrics
  const currentWeight = displayWeightLogs.length > 0 
    ? displayWeightLogs[displayWeightLogs.length - 1].weight 
    : activePlan?.userData.currentWeight || 0;
  
  const targetWeight = activePlan 
    ? activePlan.userData.currentWeight + activePlan.userData.targetWeightGain
    : user?.goals?.targetWeight || 0;
  
  const weightGained = activePlan 
    ? currentWeight - activePlan.userData.currentWeight
    : 0;
  
  const progressPercentage = activePlan
    ? Math.min(100, (weightGained / activePlan.userData.targetWeightGain) * 100)
    : 0;

  const daysSinceStart = activePlan
    ? differenceInDays(new Date(), new Date(activePlan.startDate))
    : 0;

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
                of {activePlan.userData.targetWeightGain} kg goal
              </p>
              <ProgressBar value={progressPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {progressPercentage.toFixed(0)}% complete
              </p>
            </CardContent>
          </Card>

          {/* Workout Consistency Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workout Consistency</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trackingData.consistency.workouts}%</div>
              <p className="text-xs text-muted-foreground">
                {displayWorkoutLogs.length} workouts completed
              </p>
              <ProgressBar value={trackingData.consistency.workouts} className="mt-2" />
            </CardContent>
          </Card>

          {/* Nutrition Consistency Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nutrition Tracking</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trackingData.consistency.nutrition}%</div>
              <p className="text-xs text-muted-foreground">
                Avg {activePlan.results.dailyCalories} kcal/day
              </p>
              <ProgressBar value={trackingData.consistency.nutrition} className="mt-2" />
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
                of {activePlan.userData.timeframe * 7} days
              </p>
              <ProgressBar 
                value={(daysSinceStart / (activePlan.userData.timeframe * 7)) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall Consistency Card */}
      {activePlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Overall Consistency Score
            </CardTitle>
            <CardDescription>
              Your commitment to the plan across all areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{trackingData.consistency.overall}%</span>
                <span className="text-sm text-muted-foreground">
                  {trackingData.consistency.overall >= 80 ? '🔥 Excellent!' : 
                   trackingData.consistency.overall >= 60 ? '👍 Good!' : 
                   '💪 Keep going!'}
                </span>
              </div>
              <ProgressBar value={trackingData.consistency.overall} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Workouts</p>
                  <p className="font-semibold">{trackingData.consistency.workouts}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nutrition</p>
                  <p className="font-semibold">{trackingData.consistency.nutrition}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Measurements</p>
                  <p className="font-semibold">{displayWeightLogs.length > 0 ? '✓' : '○'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WeightChart data={displayWeightLogs} isLoading={isLoadingWeight && !activePlan} />
            <CalorieChart
              data={displayMealLogs}
              calorieTarget={activePlan?.results.dailyCalories || user?.goals?.dailyCalories || 2500}
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
          previousMeasurement={activePlan ? trackingData.weightLogs[trackingData.weightLogs.length - 1] : previousMeasurement}
          isLoadingPrevious={isLoadingPrevious && !activePlan}
          isLoading={isLoggingMeasurement}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default Progress;
