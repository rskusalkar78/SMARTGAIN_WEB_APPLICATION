// SmartGain Frontend - Today's Summary Component
// Display today's logged meals, workouts, and calorie intake (Req 4.2)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TodayStats } from '@/api/types';

interface TodaySummaryProps {
  stats: TodayStats;
}

const TodaySummary = ({ stats }: TodaySummaryProps) => {
  const calorieProgress = (stats.caloriesConsumed / stats.caloriesTarget) * 100;
  const proteinProgress = (stats.proteinConsumed / stats.proteinTarget) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Summary</CardTitle>
        <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Calories</span>
            <span className="text-muted-foreground">
              {stats.caloriesConsumed.toLocaleString()} / {stats.caloriesTarget.toLocaleString()}
            </span>
          </div>
          <Progress value={Math.min(calorieProgress, 100)} className="h-2" />
        </div>

        {/* Protein */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Protein</span>
            <span className="text-muted-foreground">
              {stats.proteinConsumed}g / {stats.proteinTarget}g
            </span>
          </div>
          <Progress value={Math.min(proteinProgress, 100)} className="h-2" />
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.mealsLogged}</p>
            <p className="text-xs text-muted-foreground">Meals Logged</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.workoutsCompleted}</p>
            <p className="text-xs text-muted-foreground">Workouts Done</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaySummary;
