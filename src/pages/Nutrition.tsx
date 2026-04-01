import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { nutritionApi } from '@/api/endpoints/nutrition';
import { dashboardApi } from '@/api/endpoints/dashboard';
import { MealLogger } from '@/components/features/MealLogger';
import { MealLogData, MealLog, MealPlan } from '@/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Dumbbell } from 'lucide-react';

export function Nutrition() {
  const [today] = useState(new Date().toISOString().split('T')[0]);
  const [localMealLogs, setLocalMealLogs] = useState<MealLog[]>([]);
  const localStorageKey = `smartgain.mealLogs.${today}`;

  // Load saved local logs for today (fallback/offline mode)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as MealLog[];
      if (Array.isArray(parsed)) {
        setLocalMealLogs(parsed);
      }
    } catch {
      // ignore corrupted storage
    }
    // only run when day changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStorageKey]);

  // Persist local logs for today (fallback/offline mode)
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(localMealLogs));
    } catch {
      // ignore quota or storage errors
    }
  }, [localMealLogs, localStorageKey]);

  // Fetch dashboard data for daily calorie info
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getDashboard();
      return response;
    },
  });

  // Fetch today's meal logs
  const {
    data: mealLogs = [],
    isLoading: isMealLogsLoading,
    error: mealLogsError,
  } = useQuery({
    queryKey: ['mealLogs', today],
    queryFn: async () => {
      const response = await nutritionApi.getMealLogs(today);
      return response;
    },
  });

  // Generate meal plan mutation (quick meal plan for logging section)
  const {
    mutateAsync: generateMealPlan,
    data: mealPlan,
    isPending: isGeneratingMealPlan,
    error: mealPlanError,
  } = useMutation<MealPlan>({
    mutationFn: () => nutritionApi.generateMealPlan(),
  });
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);

  // Calculate totals from meal logs
  const effectiveMealLogs = mealLogs.length > 0 ? mealLogs : localMealLogs;
  const calorieTotal = effectiveMealLogs.reduce((sum, meal) => sum + meal.calories, 0);
  const proteinTotal = effectiveMealLogs.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const carbsTotal = effectiveMealLogs.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const fatsTotal = effectiveMealLogs.reduce((sum, meal) => sum + (meal.fats || 0), 0);

  const dailyCalorieTarget = dashboardData?.user?.goals?.dailyCalories || 2500;
  const dailyCalorieConsumed = dashboardData?.todayStats?.caloriesConsumed || calorieTotal;
  const proteinTarget = dashboardData?.todayStats?.proteinTarget || 150;
  const proteinConsumed = dashboardData?.todayStats?.proteinConsumed || proteinTotal;
  const calorieRemaining = Math.max(0, dailyCalorieTarget - dailyCalorieConsumed);
  const proteinRemaining = Math.max(0, proteinTarget - proteinConsumed);
  const upcomingWorkouts = dashboardData?.upcomingWorkouts || [];

  const handleSubmit = async (data: {
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    waterMl?: number;
    sodiumMg?: number;
    notes?: string;
  }) => {
    const supplementalNotes = [
      data.notes?.trim(),
      data.waterMl && data.waterMl > 0 ? `Water: ${data.waterMl}ml` : '',
      data.sodiumMg && data.sodiumMg > 0 ? `Sodium: ${data.sodiumMg}mg` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const mealDataWithTimestamp: MealLogData = {
      name: data.name,
      mealType: data.mealType,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fats: data.fats,
      notes: supplementalNotes || undefined,
      timestamp: new Date().toISOString(),
    };

    setIsLoggingMeal(true);
    try {
      // Try backend first (if available)
      const created = await nutritionApi.logMeal(mealDataWithTimestamp);
      setLocalMealLogs((prev) => [created, ...prev]);
    } catch {
      // Silent fallback when backend/API is unavailable: keep meal logs locally in UI
      const fallbackMeal: MealLog = {
        ...mealDataWithTimestamp,
        id: `local-${Date.now()}`,
        userId: 'local-user',
        createdAt: new Date().toISOString(),
      };
      setLocalMealLogs((prev) => [fallbackMeal, ...prev]);
    } finally {
      setIsLoggingMeal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nutrition Tracking</h1>
          <p className="text-gray-600">Log your meals and monitor daily intake</p>
        </div>
      </div>

      {/* Error States */}
      {dashboardError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Live dashboard is unavailable. Showing local meal tracking instead.
          </AlertDescription>
        </Alert>
      )}

      {mealLogsError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Could not fetch saved logs. New logs will still be tracked locally.
          </AlertDescription>
        </Alert>
      )}

      {mealPlanError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to generate meal plan. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Log Meal Section */}
        <MealLogger
          dailyCalorieTotal={dailyCalorieConsumed}
          dailyCalorieTarget={dailyCalorieTarget}
          isLoading={isLoggingMeal}
          onSubmit={handleSubmit}
        />

        {/* Daily nutrition sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>{today}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {isDashboardLoading ? (
                  <>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Calories</span>
                      <span className="font-semibold">
                        {dailyCalorieConsumed} / {dailyCalorieTarget}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Protein</span>
                      <span className="font-semibold">{proteinConsumed.toFixed(1)}g / {proteinTarget}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Carbs</span>
                      <span className="font-semibold">{carbsTotal.toFixed(1)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fat</span>
                      <span className="font-semibold">{fatsTotal.toFixed(1)}g</span>
                    </div>
                    <div className="mt-3 rounded-md bg-muted/30 p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calories remaining</span>
                        <span className="font-medium">{calorieRemaining} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein remaining</span>
                        <span className="font-medium">{proteinRemaining.toFixed(1)}g</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Meals Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Meals</CardTitle>
              <CardDescription>{effectiveMealLogs.length} meals today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isMealLogsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : effectiveMealLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No meals logged yet. Start by adding your first meal!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {effectiveMealLogs.map((meal: MealLog) => (
                    <div key={meal.id} className="flex justify-between items-start border-b pb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{meal.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {meal.mealType}
                          </Badge>
                          <span className="text-xs text-gray-600">{meal.calories} kcal</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Meal Plan Generator */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Meal Plan</CardTitle>
              <CardDescription>
                Generate a suggested meal plan you can log from.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={() => generateMealPlan()}
                disabled={isGeneratingMealPlan}
              >
                {isGeneratingMealPlan ? 'Generating meal plan...' : 'Generate New Meal Plan'}
              </button>

              {mealPlan && mealPlan.meals && mealPlan.meals.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">
                    Today&apos;s Suggested Meals
                  </div>
                  {(() => {
                    const todayMeals = mealPlan.meals[0];
                    return (
                      <div className="space-y-2 text-sm">
                        <div>
                          <div className="font-medium">Breakfast</div>
                          <div className="text-gray-700">{todayMeals.breakfast.name}</div>
                          <div className="text-xs text-gray-500">
                            {todayMeals.breakfast.calories} kcal •
                            {' '}
                            P {todayMeals.breakfast.protein}g • C {todayMeals.breakfast.carbs}g • F {todayMeals.breakfast.fats}g
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Lunch</div>
                          <div className="text-gray-700">{todayMeals.lunch.name}</div>
                          <div className="text-xs text-gray-500">
                            {todayMeals.lunch.calories} kcal •
                            {' '}
                            P {todayMeals.lunch.protein}g • C {todayMeals.lunch.carbs}g • F {todayMeals.lunch.fats}g
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Dinner</div>
                          <div className="text-gray-700">{todayMeals.dinner.name}</div>
                          <div className="text-xs text-gray-500">
                            {todayMeals.dinner.calories} kcal •
                            {' '}
                            P {todayMeals.dinner.protein}g • C {todayMeals.dinner.carbs}g • F {todayMeals.dinner.fats}g
                          </div>
                        </div>
                        {todayMeals.snacks && todayMeals.snacks.length > 0 && (
                          <div>
                            <div className="font-medium">Snacks</div>
                            <ul className="mt-1 space-y-1">
                              {todayMeals.snacks.map((snack, index) => (
                                <li key={index} className="text-gray-700">
                                  {snack.name}
                                  <span className="text-xs text-gray-500">
                                    {' '}
                                    – {snack.calories} kcal
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Exercises Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Exercises
            </CardTitle>
            <CardDescription>
              Your upcoming workout sessions from your plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : upcomingWorkouts.length === 0 ? (
              <p className="text-sm text-gray-500">No exercises scheduled yet.</p>
            ) : (
              <div className="space-y-3">
                {upcomingWorkouts.slice(0, 4).map((workout, idx) => (
                  <div key={`${workout.date}-${idx}`} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{workout.muscleGroup}</p>
                      <Badge variant="outline">{workout.estimatedDuration} min</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {workout.date}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {workout.exercises.slice(0, 3).map((exercise, exIdx) => (
                        <Badge key={`${exercise.name}-${exIdx}`} variant="secondary" className="text-xs">
                          {exercise.name}
                        </Badge>
                      ))}
                      {workout.exercises.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{workout.exercises.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
