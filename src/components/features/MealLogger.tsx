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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Validation schema
const mealLogSchema = z.object({
  name: z.string().min(1, 'Meal name is required').min(2, 'Meal name must be at least 2 characters'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: 'Please select a valid meal type' }),
  }),
  calories: z.coerce
    .number()
    .positive('Calories must be a positive number')
    .int('Calories must be a whole number')
    .min(1, 'Calories must be at least 1'),
  protein: z.coerce
    .number()
    .nonnegative('Protein cannot be negative')
    .default(0),
  carbs: z.coerce
    .number()
    .nonnegative('Carbs cannot be negative')
    .default(0),
  fats: z.coerce
    .number()
    .nonnegative('Fat cannot be negative')
    .default(0),
  waterMl: z.coerce
    .number()
    .nonnegative('Water intake cannot be negative')
    .default(0),
  sodiumMg: z.coerce
    .number()
    .nonnegative('Sodium cannot be negative')
    .default(0),
  notes: z.string().max(300, 'Notes cannot exceed 300 characters').optional().default(''),
});

type MealLogFormData = z.infer<typeof mealLogSchema>;

interface MealLoggerProps {
  dailyCalorieTotal?: number;
  dailyCalorieTarget?: number;
  onSuccess?: () => void;
  isLoading?: boolean;
  onSubmit: (data: MealLogFormData) => Promise<void>;
}

export function MealLogger({
  dailyCalorieTotal = 0,
  dailyCalorieTarget = 2500,
  onSuccess,
  isLoading = false,
  onSubmit,
}: MealLoggerProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MealLogFormData | null>(null);

  const form = useForm<MealLogFormData>({
    resolver: zodResolver(mealLogSchema),
    defaultValues: {
      name: '',
      mealType: 'lunch',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      waterMl: 0,
      sodiumMg: 0,
      notes: '',
    },
  });

  const handleSubmit = async (data: MealLogFormData) => {
    try {
      // Store form data before clearing
      setFormData(data);

      // Call the provided onSubmit handler
      await onSubmit(data);

      // Show success toast
      const newTotal = dailyCalorieTotal + data.calories;
      const remaining = Math.max(0, dailyCalorieTarget - newTotal);
      toast({
        title: 'Meal logged successfully',
        description: `${data.calories} calories added. ${remaining} calories remaining today.`,
      });

      // Reset form on success
      form.reset();
      setFormData(null);

      // Call optional success callback
      onSuccess?.();
    } catch (error) {
      // Preserve form data on error
      const errorMessage = error instanceof Error ? error.message : 'Failed to log meal';
      toast({
        title: 'Error logging meal',
        description: errorMessage,
        variant: 'destructive',
      });
      // Keep form data filled for retry
      setFormData(data);
    }
  };

  const newTotal = dailyCalorieTotal + (form.watch('calories') || 0);
  const remaining = Math.max(0, dailyCalorieTarget - newTotal);
  const percentUsed = Math.min(100, (newTotal / dailyCalorieTarget) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Meal</CardTitle>
          <CardDescription>
            Record your meal and track daily calorie intake
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Calorie Summary */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Daily Calorie Intake</span>
                <span className="font-semibold">{newTotal} / {dailyCalorieTarget} kcal</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-2">
                {remaining > 0 ? `${remaining} kcal remaining` : 'Daily target reached'}
              </div>
            </AlertDescription>
          </Alert>

          {/* Meal Logger Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Meal Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Grilled chicken with rice"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Meal Type */}
              <FormField
                control={form.control}
                name="mealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calories */}
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 500"
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Required field</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Macros Section */}
              <div className="grid grid-cols-3 gap-4">
                {/* Protein */}
                <FormField
                  control={form.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Carbs */}
                <FormField
                  control={form.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fat */}
                <FormField
                  control={form.control}
                  name="fats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Workout Support Intake */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Workout Support Intake</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="waterMl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Water (ml)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 500"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Helps hydration around workouts</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sodiumMg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sodium (mg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 400"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Useful for training performance</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional: pre-workout, post-workout, supplements, digestion notes..."
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Logging...' : 'Log Meal'}
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
    </div>
  );
}
