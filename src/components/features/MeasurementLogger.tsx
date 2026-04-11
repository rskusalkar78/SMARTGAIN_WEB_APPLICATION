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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { WeightLog } from '@/api/types';

// Validation schema
const measurementLogSchema = z.object({
  weight: z.coerce
    .number()
    .min(30, 'Weight must be at least 30 kg')
    .max(300, 'Weight must not exceed 300 kg'),
  bodyFat: z.coerce
    .number()
    .nonnegative('Body fat percentage cannot be negative')
    .max(100, 'Body fat percentage cannot exceed 100%')
    .optional()
    .or(z.literal('')),
  chest: z.coerce
    .number()
    .nonnegative('Chest measurement cannot be negative')
    .optional()
    .or(z.literal('')),
  waist: z.coerce
    .number()
    .nonnegative('Waist measurement cannot be negative')
    .optional()
    .or(z.literal('')),
  hips: z.coerce
    .number()
    .nonnegative('Hips measurement cannot be negative')
    .optional()
    .or(z.literal('')),
  leftArm: z.coerce
    .number()
    .nonnegative('Left arm measurement cannot be negative')
    .optional()
    .or(z.literal('')),
  rightArm: z.coerce
    .number()
    .nonnegative('Right arm measurement cannot be negative')
    .optional()
    .or(z.literal('')),
  leftThigh: z.coerce
    .number()
    .nonnegative('Left thigh measurement cannot be negative')
    .optional()
    .or(z.literal('')),
  rightThigh: z.coerce
    .number()
    .nonnegative('Right thigh measurement cannot be negative')
    .optional()
    .or(z.literal('')),
});

type MeasurementLogFormData = z.infer<typeof measurementLogSchema>;

interface MeasurementLoggerProps {
  previousMeasurement?: WeightLog;
  isLoadingPrevious?: boolean;
  onSuccess?: () => void;
  isLoading?: boolean;
  onSubmit: (data: MeasurementLogFormData) => Promise<void>;
}

export function MeasurementLogger({
  previousMeasurement,
  isLoadingPrevious = false,
  onSuccess,
  isLoading = false,
  onSubmit,
}: MeasurementLoggerProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MeasurementLogFormData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<MeasurementLogFormData>({
    resolver: zodResolver(measurementLogSchema),
    defaultValues: {
      weight: previousMeasurement?.weight || 0,
      bodyFat: previousMeasurement?.bodyFat || undefined,
      chest: previousMeasurement?.measurements?.chest || undefined,
      waist: previousMeasurement?.measurements?.waist || undefined,
      hips: previousMeasurement?.measurements?.hips || undefined,
      leftArm: previousMeasurement?.measurements?.leftArm || undefined,
      rightArm: previousMeasurement?.measurements?.rightArm || undefined,
      leftThigh: previousMeasurement?.measurements?.leftThigh || undefined,
      rightThigh: previousMeasurement?.measurements?.rightThigh || undefined,
    },
  });

  const handleSubmit = async (data: MeasurementLogFormData) => {
    try {
      // Store form data before clearing
      setFormData(data);

      // Call the provided onSubmit handler
      await onSubmit(data);

      // Calculate weight change
      const weightChange = previousMeasurement 
        ? (data.weight - previousMeasurement.weight).toFixed(1)
        : 'Initial';
      
      const changeIndicator = previousMeasurement 
        ? data.weight > previousMeasurement.weight 
          ? `+${weightChange} kg`
          : `${weightChange} kg`
        : '';

      // Show success toast
      toast({
        title: 'Measurement recorded successfully',
        description: `Weight: ${data.weight} kg${changeIndicator ? ` (${changeIndicator})` : ''}`,
      });

      // Reset form on success
      form.reset();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Preserve form data on error
      setFormData(data);

      // Error is handled by the parent component
      // but we could show a general error toast here if needed
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Body Measurements</CardTitle>
          <CardDescription>
            Track your weight and body measurements to monitor progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Previous Measurement Display */}
              {isLoadingPrevious ? (
                <Skeleton className="h-16 w-full rounded-lg" />
              ) : previousMeasurement ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription>
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900">Previous measurement:</p>
                      <p className="text-blue-800">
                        Weight: <span className="font-bold">{previousMeasurement.weight} kg</span>
                        {previousMeasurement.bodyFat && (
                          <>
                            {' '} • Body Fat: <span className="font-bold">{previousMeasurement.bodyFat}%</span>
                          </>
                        )}
                      </p>
                      {previousMeasurement.createdAt && (
                        <p className="text-xs text-blue-700 mt-1">
                          Recorded on {new Date(previousMeasurement.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              {/* Weight Field */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Enter your weight"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Must be between 30 kg and 300 kg
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Body Fat Field */}
              <FormField
                control={form.control}
                name="bodyFat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Fat (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Optional: Enter body fat percentage"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional - Enter as a percentage (0-100)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Advanced Measurements Toggle */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  disabled={isLoading}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Measurements
                </Button>
              </div>

              {/* Advanced Measurements */}
              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700">Body Circumference (cm, optional)</p>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="chest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chest</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Chest (cm)"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="waist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waist</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Waist (cm)"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hips"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hips</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Hips (cm)"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="leftArm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Left Arm</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Left Arm (cm)"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rightArm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Right Arm</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Right Arm (cm)"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="leftThigh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Left Thigh</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Left Thigh (cm)"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rightThigh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Right Thigh</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Right Thigh (cm)"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Saving measurement...' : 'Save Measurement'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
