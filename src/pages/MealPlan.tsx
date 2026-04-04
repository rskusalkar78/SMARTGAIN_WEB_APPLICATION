// SmartGain Frontend - Meal Plan Page
// Display user's personalized meal plan organized by day and meal type

import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { nutritionApi } from '@/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, ChefHat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealCard from '@/components/features/MealCard';
import { MealPlan as MealPlanType } from '@/api/types';
import { format, parseISO } from 'date-fns';

export function MealPlan() {
  // Fetch meal plan from backend (Req 10.1)
  const { data: mealPlan, isLoading, isError, error, refetch } = useQuery<MealPlanType>({
    queryKey: ['mealPlan'],
    queryFn: nutritionApi.getMealPlan,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  // Display skeleton loaders during loading (Req 10.5)
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state with retry button
  if (isError) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Meal Plan</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading meal plan</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{error instanceof Error ? error.message : 'Failed to load meal plan'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Handle empty meal plan state (Req 10.6)
  if (!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Meal Plan</h1>
          </div>
          
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ChefHat className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No Meal Plan Yet</CardTitle>
              <CardDescription>
                Generate a personalized meal plan based on your goals and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button onClick={() => window.location.href = '/calculator'}>
                Generate Meal Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Display meals organized by day and meal type (Req 10.2)
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meal Plan</h1>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh Plan
          </Button>
        </div>

        <Tabs defaultValue="day-0" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {mealPlan.meals.map((dailyMeals, index) => (
              <TabsTrigger key={index} value={`day-${index}`}>
                {format(parseISO(dailyMeals.date), 'EEE')}
              </TabsTrigger>
            ))}
          </TabsList>

          {mealPlan.meals.map((dailyMeals, dayIndex) => (
            <TabsContent key={dayIndex} value={`day-${dayIndex}`} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">
                  {format(parseISO(dailyMeals.date), 'EEEE')}
                </h2>
              </div>

              {/* Breakfast */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Breakfast</h3>
                <MealCard 
                  meal={dailyMeals.breakfast} 
                  mealType="breakfast"
                  date={dailyMeals.date}
                />
              </div>

              {/* Lunch */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Lunch</h3>
                <MealCard 
                  meal={dailyMeals.lunch} 
                  mealType="lunch"
                  date={dailyMeals.date}
                />
              </div>

              {/* Dinner */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Dinner</h3>
                <MealCard 
                  meal={dailyMeals.dinner} 
                  mealType="dinner"
                  date={dailyMeals.date}
                />
              </div>

              {/* Snacks */}
              {dailyMeals.snacks && dailyMeals.snacks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Snacks</h3>
                  {dailyMeals.snacks.map((snack, snackIndex) => (
                    <MealCard 
                      key={snackIndex}
                      meal={snack} 
                      mealType="snack"
                      date={dailyMeals.date}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MealPlan;
