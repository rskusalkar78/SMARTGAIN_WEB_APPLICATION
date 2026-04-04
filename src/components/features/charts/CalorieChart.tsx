import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealLog } from '@/api/types';
import { format, startOfDay, parseISO, isSameDay } from 'date-fns';

interface CalorieChartProps {
    data: MealLog[];
    calorieTarget: number;
    isLoading?: boolean;
}

export function CalorieChart({ data, calorieTarget, isLoading }: CalorieChartProps) {
    const safeData = Array.isArray(data) ? data : [];
    const chartData = useMemo(() => {
        // Group meal logs by day
        const dailyCalories = new Map<string, number>();

        safeData.forEach(log => {
            const dateKey = format(startOfDay(parseISO(log.timestamp)), 'yyyy-MM-dd');
            const currentCalories = dailyCalories.get(dateKey) || 0;
            dailyCalories.set(dateKey, currentCalories + log.calories);
        });

        // Convert to array and sort
        return Array.from(dailyCalories.entries())
            .map(([dateStr, calories]) => ({
                date: format(parseISO(dateStr), 'MMM d'),
                fullDate: format(parseISO(dateStr), 'PPP'),
                calories: Math.round(calories),
                target: calorieTarget
            }))
            .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
    }, [data, calorieTarget]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Calorie Intake</CardTitle>
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
                    <CardTitle>Calorie Intake</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No meal data available for this period
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Calorie Intake</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dy={10}
                        />
                        <YAxis
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
                        />
                        <ReferenceLine y={calorieTarget} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Target', position: 'right', fill: '#EF4444', fontSize: 10 }} />
                        <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.calories > entry.target * 1.1 ? '#EF4444' : (entry.calories < entry.target * 0.9 ? '#F59E0B' : '#10B981')}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
