import { motion } from 'framer-motion';
import { Shield, TrendingUp, Dumbbell, Info } from 'lucide-react';
import { UserData, CalculationResult } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface PlanQualitySummaryProps {
  userData: UserData;
  results: CalculationResult;
}

type SafetyLevel = 'Safe' | 'Moderate' | 'Aggressive';
type MuscleOptimization = 'Low' | 'Balanced' | 'High';

interface PlanAnalysis {
  safetyLevel: SafetyLevel;
  safetyExplanation: string;
  sustainabilityScore: number;
  sustainabilityExplanation: string;
  muscleOptimization: MuscleOptimization;
  muscleExplanation: string;
}

function analyzePlan(userData: UserData, results: CalculationResult): PlanAnalysis {
  const { weeklyGain, calorieSurplus } = results;
  const { activityLevel } = userData;
  
  // Safety Level calculation
  let safetyLevel: SafetyLevel;
  let safetyExplanation: string;
  
  if (weeklyGain <= 0.35) {
    safetyLevel = 'Safe';
    safetyExplanation = 'Your gain rate is within healthy limits for lean muscle building.';
  } else if (weeklyGain <= 0.5) {
    safetyLevel = 'Moderate';
    safetyExplanation = 'Slightly aggressive but manageable with consistent training.';
  } else {
    safetyLevel = 'Aggressive';
    safetyExplanation = 'High surplus may lead to excess fat gain. Consider extending timeline.';
  }
  
  // Sustainability Score (1-10)
  let sustainabilityScore = 10;
  
  // Deduct points for aggressive gain rate
  if (weeklyGain > 0.5) sustainabilityScore -= 3;
  else if (weeklyGain > 0.35) sustainabilityScore -= 1;
  
  // Deduct points for very high surplus
  if (calorieSurplus > 700) sustainabilityScore -= 2;
  else if (calorieSurplus > 500) sustainabilityScore -= 1;
  
  // Activity level affects sustainability
  if (activityLevel === 'sedentary') sustainabilityScore -= 1;
  if (activityLevel === 'very_active') sustainabilityScore += 1;
  
  sustainabilityScore = Math.max(1, Math.min(10, sustainabilityScore));
  
  let sustainabilityExplanation: string;
  if (sustainabilityScore >= 8) {
    sustainabilityExplanation = 'This plan is highly sustainable for long-term adherence.';
  } else if (sustainabilityScore >= 5) {
    sustainabilityExplanation = 'Moderate challenge level. Stay consistent for best results.';
  } else {
    sustainabilityExplanation = 'Consider adjusting for better long-term success.';
  }
  
  // Muscle Optimization calculation
  let muscleOptimization: MuscleOptimization;
  let muscleExplanation: string;
  
  const isActiveEnough = ['moderate', 'active', 'very_active'].includes(activityLevel);
  const optimalSurplus = calorieSurplus >= 300 && calorieSurplus <= 500;
  
  if (isActiveEnough && optimalSurplus && weeklyGain <= 0.5) {
    muscleOptimization = 'High';
    muscleExplanation = 'Optimal surplus-to-activity ratio for maximum muscle gain.';
  } else if (isActiveEnough || optimalSurplus) {
    muscleOptimization = 'Balanced';
    muscleExplanation = 'Good conditions for muscle growth with moderate fat gain.';
  } else {
    muscleOptimization = 'Low';
    muscleExplanation = 'Increase activity or adjust surplus for better muscle partitioning.';
  }
  
  return {
    safetyLevel,
    safetyExplanation,
    sustainabilityScore,
    sustainabilityExplanation,
    muscleOptimization,
    muscleExplanation,
  };
}

function getSafetyColor(level: SafetyLevel): string {
  switch (level) {
    case 'Safe': return 'text-accent bg-accent/10 border-accent/30';
    case 'Moderate': return 'text-warning bg-warning/10 border-warning/30';
    case 'Aggressive': return 'text-destructive bg-destructive/10 border-destructive/30';
  }
}

function getMuscleColor(level: MuscleOptimization): string {
  switch (level) {
    case 'High': return 'text-accent bg-accent/10 border-accent/30';
    case 'Balanced': return 'text-warning bg-warning/10 border-warning/30';
    case 'Low': return 'text-destructive bg-destructive/10 border-destructive/30';
  }
}

function getSustainabilityColor(score: number): string {
  if (score >= 7) return 'text-accent';
  if (score >= 4) return 'text-warning';
  return 'text-destructive';
}

export function PlanQualitySummary({ userData, results }: PlanQualitySummaryProps) {
  const analysis = analyzePlan(userData, results);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-card rounded-2xl p-6 mb-8 glow-effect"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold font-display">SmartGain Plan Analysis</h3>
          <p className="text-sm text-muted-foreground">Quality assessment of your personalized plan</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {/* Safety Level */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "p-4 rounded-xl border transition-all duration-200",
            getSafetyColor(analysis.safetyLevel)
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Safety Level</span>
          </div>
          <div className="text-2xl font-bold font-display mb-2">
            {analysis.safetyLevel}
          </div>
          <p className="text-xs opacity-80">{analysis.safetyExplanation}</p>
        </motion.div>
        
        {/* Sustainability Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border border-border bg-muted/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sustainability Score</span>
          </div>
          <div className={cn("text-2xl font-bold font-display mb-2", getSustainabilityColor(analysis.sustainabilityScore))}>
            {analysis.sustainabilityScore}/10
          </div>
          <p className="text-xs text-muted-foreground">{analysis.sustainabilityExplanation}</p>
        </motion.div>
        
        {/* Muscle Optimization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "p-4 rounded-xl border transition-all duration-200",
            getMuscleColor(analysis.muscleOptimization)
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4" />
            <span className="text-sm font-medium">Muscle Gain Optimization</span>
          </div>
          <div className="text-2xl font-bold font-display mb-2">
            {analysis.muscleOptimization}
          </div>
          <p className="text-xs opacity-80">{analysis.muscleExplanation}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
