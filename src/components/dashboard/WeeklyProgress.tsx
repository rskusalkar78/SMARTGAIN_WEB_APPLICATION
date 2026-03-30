// SmartGain Frontend - Weekly Progress Component
// Area chart showing weight trend over the overall timeframe (Req 4.4)

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeightLog } from '@/api/types';
import { format, subDays, startOfDay, isSameDay, addDays } from 'date-fns';

interface WeeklyProgressProps {
  weightLogs: WeightLog[];
  targetWeight?: number;
}

const WeeklyProgress = ({ weightLogs, targetWeight }: WeeklyProgressProps) => {
  const [activePlan, setActivePlan] = useState<any>(null);

  useEffect(() => {
    const planData = localStorage.getItem('smartgain_active_plan');
    if (planData) {
      setActivePlan(JSON.parse(planData));
    }
  }, []);

  const today = startOfDay(new Date());

  // If a plan exists, calculate the timeline spanning from their start date to their timeframe end date
  let dateArray: Date[] = [];
  if (activePlan?.startDate && activePlan?.userData?.timeframe) {
    const planStart = startOfDay(new Date(activePlan.startDate));
    const totalDays = activePlan.userData.timeframe * 7;
    dateArray = Array.from({ length: totalDays }, (_, i) => addDays(planStart, i));
  } else {
    // Fallback to exactly 7 days
    dateArray = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  }

  // Build chart data matching the generated timeline
  const chartData = dateArray.map((date) => {
    // Find the closest log for this specific day
    const logForDate = weightLogs.find(log => isSameDay(new Date(log.timestamp), date));
    
    return {
      date: format(date, 'MMM dd'),
      weight: logForDate ? logForDate.weight : null,
      fullDate: date, // Keep original date object for tooltip if needed
    };
  });

  // Handle empty state
  if (weightLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Progress</CardTitle>
          <CardDescription>As of {format(today, 'MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No weight data available. Start logging your weight to see progress!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate domain min and max to ensure target is visible
  const minWeight = Math.min(...weightLogs.map(l => l.weight), targetWeight || Infinity);
  const maxWeight = Math.max(...weightLogs.map(l => l.weight), targetWeight || -Infinity);
  
  // Create padded domain limits
  const domainMin = Math.floor(minWeight - 2);
  const domainMax = Math.ceil(maxWeight + 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{activePlan ? 'Goal Progress' : 'Weekly Progress'}</CardTitle>
        <CardDescription>
          {activePlan 
            ? `Timeframe: ${activePlan.userData.timeframe * 7} Days (${format(dateArray[0], 'MMM d')} - ${format(dateArray[dateArray.length - 1], 'MMM d, yyyy')})` 
            : `Week of ${format(dateArray[0], 'MMM d')} - ${format(dateArray[dateArray.length - 1], 'MMM d, yyyy')}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[domainMin, domainMax]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-card)'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            />
            {targetWeight && (
              <ReferenceLine 
                y={targetWeight} 
                stroke="hsl(var(--success))" 
                strokeDasharray="4 4" 
                label={{ 
                  position: 'insideTopLeft', 
                  value: 'Goal', 
                  fill: 'hsl(var(--success))', 
                  fontSize: 12,
                  offset: 5
                }} 
              />
            )}
            <Area
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorWeight)"
              connectNulls={true}
              activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WeeklyProgress;
