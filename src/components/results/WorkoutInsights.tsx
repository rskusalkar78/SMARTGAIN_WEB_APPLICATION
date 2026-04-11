import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, BedDouble, Dumbbell } from 'lucide-react';
import { CalculationResult, WorkoutPlan } from '@/lib/calculations';

interface WorkoutInsightsProps {
  results: CalculationResult;
  workoutPlan: WorkoutPlan;
}

export function WorkoutInsights({ results, workoutPlan }: WorkoutInsightsProps) {
  const { weeklyGain, calorieSurplus } = results;
  const { daysPerWeek } = workoutPlan;
  
  // Calculate rest days
  const restDays = 7 - daysPerWeek;
  
  // Generate dynamic insights
  const insights = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: 'Training volume matches your calorie surplus',
      description: `Your ${daysPerWeek}-day program is calibrated to utilize the extra ${calorieSurplus} kcal daily surplus for muscle synthesis rather than fat storage.`,
    },
    {
      icon: <BedDouble className="w-4 h-4" />,
      title: 'Rest days prevent muscle loss',
      description: `With ${restDays} rest days per week, your muscles have adequate time to repair and grow. This prevents overtraining that can hinder gains.`,
    },
    {
      icon: <Dumbbell className="w-4 h-4" />,
      title: 'Progressive overload aligns with weekly gain',
      description: `At ${weeklyGain.toFixed(2)} kg/week, you can expect to add 2.5-5kg to major lifts every 2-3 weeks as you get stronger.`,
    },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="mt-6 p-5 rounded-xl bg-primary/5 border border-primary/20"
    >
      <h4 className="font-semibold font-display mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-primary" />
        Why This Workout Supports Your Gain Goal
      </h4>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              {insight.icon}
            </div>
            <div>
              <div className="font-medium text-sm">{insight.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{insight.description}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
