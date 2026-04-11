import { motion } from 'framer-motion';
import { Target, Info } from 'lucide-react';
import { CalculationResult } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface ConfidenceIndicatorProps {
  results: CalculationResult;
}

type ConfidenceLevel = 'High' | 'Medium' | 'Low';

function calculateConfidence(results: CalculationResult): { level: ConfidenceLevel; percentage: number } {
  const { weeklyGain, calorieSurplus } = results;
  
  let score = 100;
  
  // Deduct for aggressive gain rates
  if (weeklyGain > 0.75) score -= 40;
  else if (weeklyGain > 0.5) score -= 25;
  else if (weeklyGain > 0.4) score -= 10;
  
  // Deduct for extreme surplus
  if (calorieSurplus > 800) score -= 25;
  else if (calorieSurplus > 600) score -= 15;
  else if (calorieSurplus > 500) score -= 5;
  
  // Bonus for optimal range
  if (weeklyGain >= 0.25 && weeklyGain <= 0.4 && calorieSurplus >= 300 && calorieSurplus <= 500) {
    score = Math.min(100, score + 10);
  }
  
  const percentage = Math.max(20, Math.min(100, score));
  
  let level: ConfidenceLevel;
  if (percentage >= 70) level = 'High';
  else if (percentage >= 45) level = 'Medium';
  else level = 'Low';
  
  return { level, percentage };
}

export function ConfidenceIndicator({ results }: ConfidenceIndicatorProps) {
  const { level, percentage } = calculateConfidence(results);
  
  const getColor = () => {
    switch (level) {
      case 'High': return 'from-accent to-accent/70';
      case 'Medium': return 'from-warning to-warning/70';
      case 'Low': return 'from-destructive to-destructive/70';
    }
  };
  
  const getTextColor = () => {
    switch (level) {
      case 'High': return 'text-accent';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-destructive';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
      className="glass-card rounded-2xl p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold font-display">Weight Projection Confidence</h3>
        </div>
        <span className={cn("font-bold text-xl", getTextColor())}>{level}</span>
      </div>
      
      <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-foreground/80">{percentage}%</span>
        </div>
      </div>
      
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          {level === 'High' && "Your plan parameters are optimal. Consistency will maximize your results."}
          {level === 'Medium' && "Moderate confidence. Stay consistent and track weekly to improve accuracy."}
          {level === 'Low' && "Consider adjusting your timeline for more predictable results."}
          {" "}
          <span className="text-primary">Consistency improves accuracy.</span>
        </p>
      </div>
    </motion.div>
  );
}
