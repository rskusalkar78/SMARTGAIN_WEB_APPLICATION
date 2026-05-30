// SmartGain Frontend - Dashboard Header Component
// Welcome message and current date display

import { Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  userName: string;
}

const DashboardHeader = ({ userName }: DashboardHeaderProps) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Mocking the streak for now. This could come from the backend.
  const streakDays = 3;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">{currentDate}</p>
      </div>
      <Badge variant="secondary" className="w-fit flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400 dark:bg-orange-500/20 dark:hover:bg-orange-500/30">
        <Flame className="h-4 w-4" fill="currentColor" />
        {streakDays} Day Streak
      </Badge>
    </div>
  );
};

export default DashboardHeader;
