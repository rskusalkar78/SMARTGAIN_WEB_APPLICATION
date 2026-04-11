import { motion } from 'framer-motion';
import { Flame, Sparkles, Info } from 'lucide-react';
import { CalculationResult } from '@/lib/calculations';

interface AdaptiveCaloriesCardProps {
  results: CalculationResult;
}

export function AdaptiveCaloriesCard({ results }: AdaptiveCaloriesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-6 text-center glow-effect"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Adaptive Target
        </span>
      </div>
      
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-warning flex items-center justify-center mx-auto mb-4">
        <Flame className="w-8 h-8 text-primary-foreground" />
      </div>
      
      <div className="text-4xl font-bold font-display gradient-text mb-2">
        {results.dailyCalories.toLocaleString()}
      </div>
      <div className="text-muted-foreground mb-3">Daily Calories</div>
      
      <div className="text-sm text-muted-foreground mb-3">
        +{results.calorieSurplus} surplus for muscle growth
      </div>
      
      <div className="p-3 rounded-lg bg-muted/50 text-left">
        <p className="text-xs text-muted-foreground mb-2">
          This target will auto-adjust weekly based on your progress.
        </p>
        <div className="flex items-start gap-1.5">
          <Info className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            ±100–150 kcal adjustments if weight change is slower or faster than expected
          </p>
        </div>
      </div>
    </motion.div>
  );
}
