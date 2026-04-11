// SmartGain Frontend - Stats Overview Component
// Display current weight, target weight, and daily calorie goal (Req 4.1)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Flame } from 'lucide-react';
import { UserGoals } from '@/api/types';

interface StatsOverviewProps {
  goals: UserGoals;
}

const StatsOverview = ({ goals }: StatsOverviewProps) => {
  const stats = [
    {
      title: 'Current Weight',
      value: `${goals.currentWeight} kg`,
      icon: TrendingUp,
      description: 'Your current weight',
    },
    {
      title: 'Target Weight',
      value: `${goals.targetWeight} kg`,
      icon: Target,
      description: `Goal: +${(goals.targetWeight - goals.currentWeight).toFixed(1)} kg`,
    },
    {
      title: 'Daily Calories',
      value: goals.dailyCalories.toLocaleString(),
      icon: Flame,
      description: 'Calorie target',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
