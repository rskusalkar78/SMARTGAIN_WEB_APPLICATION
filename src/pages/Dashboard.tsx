// SmartGain Frontend - Dashboard Page
// Main user interface displaying personalized data and quick actions

import AppLayout from '@/components/layout/AppLayout';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsOverview from '@/components/dashboard/StatsOverview';
import TodaySummary from '@/components/dashboard/TodaySummary';
import QuickActions from '@/components/dashboard/QuickActions';
import WeeklyProgress from '@/components/dashboard/WeeklyProgress';

export function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  // Loading state with skeleton loaders (Req 4.5)
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </AppLayout>
    );
  }

  // Error state with retry button (Req 4.6)
  if (isError) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading dashboard</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{error instanceof Error ? error.message : 'Failed to load dashboard data'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Success state with all dashboard components
  if (!data) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader userName={data.user.name} />
        <StatsOverview goals={data.user.goals} />
        <div className="grid gap-4 md:grid-cols-2">
          <TodaySummary stats={data.todayStats} />
          <QuickActions />
        </div>
        <WeeklyProgress weightLogs={data.weeklyProgress} targetWeight={data.user.goals.targetWeight} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
