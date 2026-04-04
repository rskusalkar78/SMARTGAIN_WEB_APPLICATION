// SmartGain Frontend - Profile Page
// User profile management with personal info, goals, and preferences

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/endpoints/user';
import { UpdateProfileData, ActivityLevel, MeasurementUnit } from '@/api/types';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription, // Fix: Import FormDescription as FormDescription
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Save, User, Target, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ============================================================================
// Validation Schemas
// ============================================================================

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    currentWeight: z.coerce.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be under 300kg'),
    targetWeight: z.coerce.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be under 300kg'),
    weeklyGainGoal: z.coerce.number().min(-1, 'Invalid goal').max(1, 'Invalid goal'),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very', 'extreme']),
    measurementUnit: z.enum(['metric', 'imperial']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ============================================================================
// Profile Component
// ============================================================================

export const Profile = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch user profile
    const { data: user, isLoading, isError, error } = useQuery({
        queryKey: ['user', 'profile'],
        queryFn: userApi.getProfile,
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: userApi.updateProfile,
        onSuccess: (data) => {
            queryClient.setQueryData(['user', 'profile'], data);
            toast({
                title: 'Profile updated',
                description: 'Your changes have been saved successfully.',
            });
        },
        onError: (err) => {
            toast({
                title: 'Update failed',
                description: err instanceof Error ? err.message : 'Failed to update profile',
                variant: 'destructive',
            });
        },
    });

    // Form setup
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            email: '',
            currentWeight: 0,
            targetWeight: 0,
            weeklyGainGoal: 0,
            activityLevel: 'sedentary',
            measurementUnit: 'metric',
        },
    });

    // Update form values when user data is loaded
    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                currentWeight: user.goals.currentWeight,
                targetWeight: user.goals.targetWeight,
                weeklyGainGoal: user.goals.weeklyGainGoal,
                activityLevel: user.preferences.activityLevel,
                measurementUnit: user.preferences.measurementUnit,
            });
        }
    }, [user, form]);

    const onSubmit = (data: ProfileFormValues) => {
        const updateData: UpdateProfileData = {
            name: data.name,
            email: data.email,
            goals: {
                currentWeight: data.currentWeight,
                targetWeight: data.targetWeight,
                weeklyGainGoal: data.weeklyGainGoal,
            },
            preferences: {
                activityLevel: data.activityLevel as ActivityLevel,
                measurementUnit: data.measurementUnit as MeasurementUnit,
            },
        };
        updateProfileMutation.mutate(updateData);
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="space-y-6 max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </AppLayout>
        );
    }

    if (isError) {
        return (
            <AppLayout>
                <div className="space-y-6 max-w-4xl mx-auto">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error loading profile</AlertTitle>
                        <AlertDescription>
                            {error instanceof Error ? error.message : 'Failed to load profile data'}
                        </AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="personal" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">Personal Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="goals" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span className="hidden sm:inline">Goals</span>
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Preferences</span>
                        </TabsTrigger>
                    </TabsList>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                            {/* Personal Info Tab */}
                            <TabsContent value="personal">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>
                                            Update your personal details here.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Your name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Your email" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Goals Tab */}
                            <TabsContent value="goals">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Fitness Goals</CardTitle>
                                        <CardDescription>
                                            Adjust your physical stats and targets.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="currentWeight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Current Weight (kg)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="targetWeight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Target Weight (kg)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="weeklyGainGoal"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Weekly Goal (kg/week)</FormLabel>
                                                    <Select
                                                        onValueChange={(value) => field.onChange(parseFloat(value))}
                                                        value={field.value?.toString()}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a goal" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="-0.5">Lose 0.5 kg</SelectItem>
                                                            <SelectItem value="-0.25">Lose 0.25 kg</SelectItem>
                                                            <SelectItem value="0">Maintain Weight</SelectItem>
                                                            <SelectItem value="0.25">Gain 0.25 kg</SelectItem>
                                                            <SelectItem value="0.5">Gain 0.5 kg</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Preferences Tab */}
                            <TabsContent value="preferences">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Preferences</CardTitle>
                                        <CardDescription>
                                            Customize your app experience.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="activityLevel"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Activity Level</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select activity level" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="sedentary">Sedentary (Office job)</SelectItem>
                                                            <SelectItem value="light">Light (1-2 days/week)</SelectItem>
                                                            <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                                                            <SelectItem value="very">Very Active (6-7 days/week)</SelectItem>
                                                            <SelectItem value="extreme">Extreme (Physical job + training)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="measurementUnit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Measurement Unit</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select unit" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                                                            <SelectItem value="imperial">Imperial (lbs/in)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? (
                                        <>
                                            <span className="animate-spin mr-2">⏳</span> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>

                        </form>
                    </Form>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default Profile;
