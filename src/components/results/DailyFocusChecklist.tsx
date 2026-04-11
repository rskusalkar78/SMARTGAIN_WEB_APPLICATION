import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Flame, Dumbbell, Droplets, Moon, Scale } from 'lucide-react';
import { CalculationResult } from '@/lib/calculations';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DailyFocusChecklistProps {
  results: CalculationResult;
}

interface ChecklistItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function DailyFocusChecklist({ results }: DailyFocusChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  const checklistItems: ChecklistItem[] = [
    {
      id: 'calories',
      icon: <Flame className="w-4 h-4" />,
      title: `Hit calorie target ±100 kcal`,
      description: `Aim for ${results.dailyCalories.toLocaleString()} kcal today`,
    },
    {
      id: 'workout',
      icon: <Dumbbell className="w-4 h-4" />,
      title: 'Complete planned workout or rest properly',
      description: 'Consistency builds momentum',
    },
    {
      id: 'water',
      icon: <Droplets className="w-4 h-4" />,
      title: 'Drink recommended water intake',
      description: 'At least 2.5-3 liters for optimal performance',
    },
    {
      id: 'sleep',
      icon: <Moon className="w-4 h-4" />,
      title: 'Sleep at least 7-8 hours',
      description: 'Muscle recovery happens during rest',
    },
    {
      id: 'weight',
      icon: <Scale className="w-4 h-4" />,
      title: 'Log weight once per week',
      description: 'Track progress every Monday morning',
    },
  ];
  
  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const completedCount = checkedItems.size;
  const totalCount = checklistItems.length;
  const progressPercent = (completedCount / totalCount) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-card rounded-2xl p-6 mb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold font-display flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Your Daily Focus
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Small daily wins lead to big transformations
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-display text-primary">
            {completedCount}/{totalCount}
          </div>
          <div className="text-xs text-muted-foreground">completed</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <div className="space-y-3">
        {checklistItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 + index * 0.05 }}
            onClick={() => toggleItem(item.id)}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
              checkedItems.has(item.id)
                ? "border-accent/50 bg-accent/10"
                : "border-border hover:border-primary/50 bg-muted/30"
            )}
          >
            <div className={cn(
              "mt-0.5 transition-colors duration-200",
              checkedItems.has(item.id) ? "text-accent" : "text-muted-foreground"
            )}>
              {checkedItems.has(item.id) ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className={cn(
                "font-medium transition-all duration-200",
                checkedItems.has(item.id) && "line-through opacity-70"
              )}>
                {item.title}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {item.description}
              </div>
            </div>
            <div className={cn(
              "p-2 rounded-lg transition-colors duration-200",
              checkedItems.has(item.id) ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
            )}>
              {item.icon}
            </div>
          </motion.button>
        ))}
      </div>
      
      {completedCount === totalCount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-center"
        >
          <p className="text-accent font-medium">🎉 Amazing! All daily goals completed!</p>
          <p className="text-sm text-muted-foreground mt-1">You're building unstoppable momentum</p>
        </motion.div>
      )}
    </motion.div>
  );
}
