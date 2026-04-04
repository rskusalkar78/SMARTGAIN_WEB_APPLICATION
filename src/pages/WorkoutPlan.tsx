// SmartGain Frontend - Workout Plan Page
// Display user's personalized workout plan organized by day and muscle group

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { workoutApi } from '@/api/endpoints/workout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Dumbbell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExerciseCard from '@/components/features/ExerciseCard';
import { WorkoutPlan as WorkoutPlanType } from '@/api/types';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export function WorkoutPlan() {
  const queryClient = useQueryClient();

  // Fetch workout plan from backend (Req 11.1)
  const { data: workoutPlan, isLoading, isError, error, refetch } = useQuery<WorkoutPlanType>({
    queryKey: ['workoutPlan'],
    queryFn: workoutApi.getWorkoutPlan,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  // Mutation for generating workout plan
  const generatePlanMutation = useMutation({
    mutationFn: workoutApi.generateWorkoutPlan,
    onSuccess: (newPlan) => {
      // Update the cache with the new plan
      queryClient.setQueryData(['workoutPlan'], newPlan);
      toast({
        title: "Workout Plan Generated",
        description: "Your personalized workout plan has been created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = () => {
    generatePlanMutation.mutate();
  };

  // Display skeleton loaders during loading (Req 11.5)
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
          <h1 className="text-3xl font-bold">Workout Plan</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading workout plan</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{error instanceof Error ? error.message : 'Failed to load workout plan'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Handle empty workout plan state (Req 11.6)
  if (!workoutPlan || !workoutPlan.workouts || workoutPlan.workouts.length === 0) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Workout Plan</h1>
          </div>
          
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Dumbbell className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No Workout Plan Yet</CardTitle>
              <CardDescription>
                Generate a personalized workout plan based on your goals and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 pb-6">
              <Button 
                onClick={handleGeneratePlan}
                disabled={generatePlanMutation.isPending}
                className="min-w-[200px]"
              >
                {generatePlanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  'Generate Workout Plan'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/calculator'}
                className="text-sm"
              >
                Update Goals First
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }



  // Display workouts organized by day and muscle group (Req 11.2)
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workout Plan</h1>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh Plan
          </Button>
        </div>

        <Tabs defaultValue="day-0" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {workoutPlan.workouts.map((dailyWorkout, index) => (
              <TabsTrigger key={index} value={`day-${index}`}>
                {format(parseISO(dailyWorkout.date), 'EEE')}
              </TabsTrigger>
            ))}
          </TabsList>

          {workoutPlan.workouts.map((dailyWorkout, dayIndex) => (
            <TabsContent key={dayIndex} value={`day-${dayIndex}`} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">
                  {format(parseISO(dailyWorkout.date), 'EEEE')}
                </h2>
                <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Target: {dailyWorkout.muscleGroup}</span>
                  <span>•</span>
                  <span>Duration: ~{dailyWorkout.estimatedDuration} min</span>
                </div>
              </div>

              {/* Exercise Cards - Show exercise details (sets, reps, rest) (Req 11.3) */}
              {dailyWorkout.isRestDay || dailyWorkout.exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 mt-4 rounded-xl border border-dashed text-center bg-muted/20">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4 text-secondary">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Rest & Recovery Day</h3>
                  <p className="text-muted-foreground max-w-md">
                    Take it easy today. Focus on light stretching, hydration, and letting your muscles rebuild.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyWorkout.exercises.map((exercise, exerciseIndex) => (
                    <ExerciseCard 
                      key={exerciseIndex}
                      exercise={exercise} 
                      date={dailyWorkout.date}
                      exerciseIndex={exerciseIndex}
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

export default WorkoutPlan;