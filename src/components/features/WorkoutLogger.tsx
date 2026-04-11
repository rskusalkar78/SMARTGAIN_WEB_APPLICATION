import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Validation schema
const workoutLogSchema = z.object({
  workoutType: z.string().min(1, 'Workout type is required').min(2, 'Workout type must be at least 2 characters'),
  intensity: z.enum(['low', 'moderate', 'high'], {
    errorMap: () => ({ message: 'Please select a valid intensity level' }),
  }),
  duration: z.coerce
    .number()
    .positive('Duration must be a positive number')
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute'),
  exercises: z.string().optional(),
  notes: z.string().optional(),
});

type WorkoutLogFormData = z.infer<typeof workoutLogSchema>;

interface Workout {
  id: string;
  workoutType: string;
  intensity: 'low' | 'moderate' | 'high';
  duration: number;
  exercises?: string;
  timestamp: string;
  date?: string;
}

interface WorkoutLoggerProps {
  weeklyWorkouts?: Workout[];
  isLoadingWorkouts?: boolean;
  onSuccess?: () => void;
  isLoading?: boolean;
  onSubmit: (data: WorkoutLogFormData) => Promise<void>;
}

export function WorkoutLogger({
  weeklyWorkouts = [],
  isLoadingWorkouts = false,
  onSuccess,
  isLoading = false,
  onSubmit,
}: WorkoutLoggerProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<WorkoutLogFormData | null>(null);

  const form = useForm<WorkoutLogFormData>({
    resolver: zodResolver(workoutLogSchema),
    defaultValues: {
      workoutType: '',
      intensity: 'moderate',
      duration: 30,
      exercises: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: WorkoutLogFormData) => {
    try {
      // Store form data before clearing
      setFormData(data);

      // Call the provided onSubmit handler
      await onSubmit(data);

      // Show success toast
      toast({
        title: 'Workout logged successfully',
        description: `${data.duration} minute ${data.workoutType} workout recorded.`,
      });

      // Reset form on success
      form.reset();
      setFormData(null);

      // Call optional success callback
      onSuccess?.();
    } catch (error) {
      // Preserve form data on error
      const errorMessage = error instanceof Error ? error.message : 'Failed to log workout';
      toast({
        title: 'Error logging workout',
        description: errorMessage,
        variant: 'destructive',
      });
      // Keep form data filled for retry
      setFormData(data);
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalWeeklyDuration = weeklyWorkouts.reduce((sum, workout) => sum + (workout.duration || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Workout</CardTitle>
          <CardDescription>
            Record your workout and track fitness progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workout Logger Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Workout Type */}
              <FormField
                control={form.control}
                name="workoutType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Running, Weight training, Cycling"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Type of exercise performed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Intensity Level */}
              <FormField
                control={form.control}
                name="intensity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intensity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select intensity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low (50-60% max HR)</SelectItem>
                        <SelectItem value="moderate">Moderate (60-70% max HR)</SelectItem>
                        <SelectItem value="high">High (70%+ max HR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Required field</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Exercises (Optional) */}
              <FormField
                control={form.control}
                name="exercises"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercises</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Bench press, Squats, Deadlifts"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Optional - Specific exercises performed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes (Optional) */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="How did it feel? Any observations?"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Optional notes about your workout</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Logging...' : 'Log Workout'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => {
                    form.reset();
                    setFormData(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Weekly Workout Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
          <CardDescription>Past 7 days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weekly Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold">{totalWeeklyDuration} <span className="text-sm text-gray-500">min</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Workouts</p>
              <p className="text-2xl font-bold">{weeklyWorkouts.length}</p>
            </div>
          </div>

          {/* Workout History */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Workout History</h4>
            {isLoadingWorkouts ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : weeklyWorkouts.length === 0 ? (
              <p className="text-sm text-gray-500">No workouts logged this week. Start by adding your first workout!</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {weeklyWorkouts.map((workout) => (
                  <div key={workout.id} className="flex justify-between items-start border-b pb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{workout.workoutType}</p>
                        <Badge 
                          className={`text-xs ${getIntensityColor(workout.intensity)}`}
                          variant="outline"
                        >
                          {workout.intensity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {workout.duration} minutes
                        {workout.exercises && ` • ${workout.exercises}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
