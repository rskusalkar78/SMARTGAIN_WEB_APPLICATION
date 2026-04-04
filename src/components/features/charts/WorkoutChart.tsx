import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WorkoutLog, WorkoutPlan } from '@/api/types';
import { format, startOfDay, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

interface WorkoutChartProps {
    data: WorkoutLog[];
    workoutPlan?: WorkoutPlan;
    isLoading?: boolean;
}

export function WorkoutChart({ data, workoutPlan, isLoading }: WorkoutChartProps) {
    const safeData = Array.isArray(data) ? data : [];
    // Calculate completion rate and weekly breakdown
    const { completionRate, weeklyData } = useMemo(() => {
        if (!workoutPlan || !(workoutPlan as any).workouts || (workoutPlan as any).workouts.length === 0) {
            // If no plan, just show workout counts per day
            const dailyWorkouts = new Map<string, number>();

            safeData.forEach(log => {
                const dateKey = format(startOfDay(parseISO(log.timestamp)), 'yyyy-MM-dd');
                const currentCount = dailyWorkouts.get(dateKey) || 0;
                dailyWorkouts.set(dateKey, currentCount + 1);
            });

            const weeklyData = Array.from(dailyWorkouts.entries())
                .map(([dateStr, count]) => ({
                    date: format(parseISO(dateStr), 'MMM d'),
                    fullDate: format(parseISO(dateStr), 'PPP'),
                    workouts: count,
                    planned: 0,
                    completionRate: 0
                }))
                .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

            return { completionRate: 0, weeklyData };
        }

        // Calculate completion rate based on workout plan
        const plannedWorkouts = (workoutPlan as any).workouts.length;
        const completedWorkouts = safeData.length;
        const rate = plannedWorkouts > 0 ? Math.round((completedWorkouts / plannedWorkouts) * 100) : 0;

        // Group by week for visualization
        const weeklyMap = new Map<string, { completed: number; planned: number }>();

        // Count planned workouts per week
        workoutPlan.workouts.forEach(workout => {
            const workoutDate = parseISO(workout.date);
            const weekStart = startOfWeek(workoutDate);
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            
            const current = weeklyMap.get(weekKey) || { completed: 0, planned: 0 };
            weeklyMap.set(weekKey, { ...current, planned: current.planned + 1 });
        });

        // Count completed workouts per week
        safeData.forEach(log => {
            const logDate = parseISO(log.timestamp);
            const weekStart = startOfWeek(logDate);
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            
            const current = weeklyMap.get(weekKey) || { completed: 0, planned: 0 };
            weeklyMap.set(weekKey, { ...current, completed: current.completed + 1 });
        });

        const weeklyData = Array.from(weeklyMap.entries())
            .map(([weekKey, counts]) => {
                const weekStart = parseISO(weekKey);
                const completionRate = counts.planned > 0 
                    ? Math.round((counts.completed / counts.planned) * 100) 
                    : 0;
                
                return {
                    date: format(weekStart, 'MMM d'),
                    fullDate: `Week of ${format(weekStart, 'PPP')}`,
                    workouts: counts.completed,
                    planned: counts.planned,
                    completionRate
                };
            })
            .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

        return { completionRate: rate, weeklyData };
    }, [safeData, workoutPlan]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Workout Consistency</CardTitle>
                    <CardDescription>Track your workout completion rate</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    if (safeData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Workout Consistency</CardTitle>
                    <CardDescription>Track your workout completion rate</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No workout data available for this period
                </CardContent>
            </Card>
        );
    }

    // Determine color based on completion rate
    const getCompletionColor = (rate: number) => {
        if (rate >= 80) return '#10B981'; // Green - excellent
        if (rate >= 60) return '#F59E0B'; // Amber - good
        return '#EF4444'; // Red - needs improvement
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workout Consistency</CardTitle>
                <CardDescription>
                    {workoutPlan && workoutPlan.workouts?.length > 0 ? (
                        <span className="flex items-center gap-2">
                            Overall completion rate: 
                            <span 
                                className="font-bold text-lg" 
                                style={{ color: getCompletionColor(completionRate) }}
                            >
                                {completionRate}%
                            </span>
                        </span>
                    ) : (
                        'Workout frequency over time'
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dy={10}
                        />
                        <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #E5E7EB',
                                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                            }}
                            cursor={{ fill: '#F3F4F6' }}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.fullDate;
                                }
                                return label;
                            }}
                            formatter={(value: any, name: string) => {
                                if (name === 'workouts') {
                                    const payload = weeklyData.find(d => d.workouts === value);
                                    if (payload && payload.planned > 0) {
                                        return [`${value} of ${payload.planned} (${payload.completionRate}%)`, 'Completed'];
                                    }
                                    return [value, 'Workouts'];
                                }
                                return [value, name];
                            }}
                        />
                        <Bar dataKey="workouts" radius={[4, 4, 0, 0]} barSize={40}>
                            {weeklyData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.planned > 0 ? getCompletionColor(entry.completionRate) : 'hsl(var(--primary))'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
