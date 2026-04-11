// SmartGain Frontend - Quick Actions Component
// Action buttons for logging meals, workouts, and measurements (Req 4.3)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Utensils, Dumbbell, Scale } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      title: 'Log Meal',
      description: 'Track your nutrition',
      icon: Utensils,
      href: '/app/nutrition/log',
      variant: 'default' as const,
    },
    {
      title: 'Log Workout',
      description: 'Record your training',
      icon: Dumbbell,
      href: '/app/workout/log',
      variant: 'secondary' as const,
    },
    {
      title: 'Log Weight',
      description: 'Update measurements',
      icon: Scale,
      href: '/app/progress',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant={action.variant}
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link to={action.href}>
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs font-normal opacity-80">{action.description}</div>
                </div>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
