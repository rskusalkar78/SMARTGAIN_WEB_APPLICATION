import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, ArrowLeft, ChevronRight, Rocket, 
  Settings2, Info, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserData, CalculationResult, WorkoutPlan } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Import new result components
import { PlanQualitySummary } from '@/components/results/PlanQualitySummary';
import { EnhancedWarning } from '@/components/results/EnhancedWarning';
import { AdaptiveCaloriesCard } from '@/components/results/AdaptiveCaloriesCard';
import { MetabolicProfile } from '@/components/results/MetabolicProfile';
import { MacroFoodEquivalents } from '@/components/results/MacroFoodEquivalents';
import { WorkoutInsights } from '@/components/results/WorkoutInsights';
import { DailyFocusChecklist } from '@/components/results/DailyFocusChecklist';
import { ConfidenceIndicator } from '@/components/results/ConfidenceIndicator';

interface ResultsProps {
  userData: UserData;
  results: CalculationResult;
  workoutPlan: WorkoutPlan;
  onReset: () => void;
  onRecalculate?: (newUserData: Partial<UserData>) => void;
}

export function Results({ userData, results, workoutPlan, onReset, onRecalculate }: ResultsProps) {
  const [hasAppliedSaferPlan, setHasAppliedSaferPlan] = useState(false);
  const [isStartingPlan, setIsStartingPlan] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const handleMakeSafer = (newTimeframe: number) => {
    if (onRecalculate) {
      // First, update local state to show banner
      setHasAppliedSaferPlan(true);
      
      // Then recalculate with new timeframe
      onRecalculate({ timeframe: newTimeframe });
    }
  };

  const handleStartTracking = async () => {
    setIsStartingPlan(true);
    
    try {
      // Save the plan data
      const planData = {
        userData,
        results,
        workoutPlan,
        startDate: new Date().toISOString(),
      };

      // Save to localStorage (backend integration will come later)
      localStorage.setItem('smartgain_active_plan', JSON.stringify(planData));

      // If user is not authenticated, create a guest session
      if (!isAuthenticated) {
        // Store guest flag
        localStorage.setItem('smartgain_guest_mode', 'true');
        
        toast({
          title: "Plan Activated! 🎉",
          description: "Your plan is ready. You can create an account later to sync across devices.",
        });
      } else {
        toast({
          title: "Plan Activated! 🎉",
          description: "Your personalized plan is now active. Let's start tracking your progress!",
        });
      }

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Plan activation error:', error);
      toast({
        title: "Error",
        description: "Failed to activate plan. Please try again.",
        variant: "destructive",
      });
      setIsStartingPlan(false);
    }
  };

  return (
    <section className="min-h-screen py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Button variant="ghost" onClick={onReset} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Your Personalized Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Based on your goals of gaining {userData.targetWeightGain}kg in {userData.timeframe} weeks
          </p>
        </motion.div>

        {/* Safer Plan Applied Banner */}
        {hasAppliedSaferPlan && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 p-5 rounded-xl bg-accent/10 border border-accent/30"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-accent mb-2">Safer Plan Applied! ✓</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your plan has been updated to a healthier, more sustainable weight gain rate.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">New Timeline</div>
                    <div className="font-bold text-accent">{userData.timeframe} weeks</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Weekly Gain Rate</div>
                    <div className="font-bold text-accent">{results.weeklyGain.toFixed(2)} kg/week</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Daily Calories</div>
                    <div className="font-bold text-accent">{results.dailyCalories} kcal</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plan Quality Summary - NEW */}
        <PlanQualitySummary userData={userData} results={results} />

        {/* Enhanced Warning - NEW */}
        <EnhancedWarning 
          userData={userData} 
          results={results} 
          onMakeSafer={handleMakeSafer}
          hasAppliedSaferPlan={hasAppliedSaferPlan}
        />

        {/* Main Stats Grid with Adaptive Calories */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Adaptive Calories Card - Enhanced */}
          <AdaptiveCaloriesCard results={results} />

          {/* Weekly Gain */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-success flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-4xl font-bold font-display mb-2">
              {results.weeklyGain.toFixed(2)}kg
            </div>
            <div className="text-muted-foreground">Weekly Gain</div>
            <div className={cn(
              "mt-3 text-sm",
              results.isHealthyRate ? "text-accent" : "text-warning"
            )}>
              {results.isHealthyRate ? '✓ Healthy rate' : '⚠ Aggressive rate'}
            </div>
          </motion.div>

          {/* Target Weight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-bold font-display mb-2">
              {(userData.currentWeight + userData.targetWeightGain).toFixed(1)}kg
            </div>
            <div className="text-muted-foreground">Target Weight</div>
            <div className="mt-3 text-sm text-muted-foreground">
              From {userData.currentWeight}kg
            </div>
          </motion.div>
        </div>

        {/* Metabolic Profile - Enhanced with tooltips */}
        <MetabolicProfile results={results} />

        {/* Macro Breakdown with Food Equivalents - Enhanced */}
        <MacroFoodEquivalents results={results} userData={userData} />

        {/* Confidence Indicator - NEW */}
        <ConfidenceIndicator results={results} />

        {/* Workout Plan Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6 mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold font-display flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                {workoutPlan.name}
              </h3>
              <p className="text-muted-foreground mt-1">{workoutPlan.description}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <span className="font-semibold">{workoutPlan.daysPerWeek}</span>
              <span>days/week</span>
            </div>
          </div>

          <div className="space-y-4">
            {workoutPlan.split.slice(0, 5).map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200",
                  day.isRestDay 
                    ? "border-muted bg-muted/30" 
                    : "border-border hover:border-primary/50 cursor-pointer"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{day.day}</div>
                    <div className="text-sm text-muted-foreground">{day.focus}</div>
                  </div>
                  {!day.isRestDay && (
                    <div className="flex items-center text-muted-foreground">
                      <span className="text-sm mr-2">{day.exercises.length} exercises</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                {!day.isRestDay && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {day.exercises.slice(0, 3).map((exercise) => (
                      <span 
                        key={exercise.name}
                        className="px-2 py-1 rounded-md bg-muted text-xs"
                      >
                        {exercise.name}
                      </span>
                    ))}
                    {day.exercises.length > 3 && (
                      <span className="px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                        +{day.exercises.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
            <h4 className="font-semibold mb-2">Pro Tips</h4>
            <ul className="space-y-1">
              {workoutPlan.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-accent">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Workout Insights - NEW */}
          <WorkoutInsights results={results} workoutPlan={workoutPlan} />
        </motion.div>

        {/* Daily Focus Checklist - NEW */}
        <DailyFocusChecklist results={results} />

        {/* Enhanced CTA Section - NEW */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="lg"
              onClick={handleStartTracking}
              disabled={isStartingPlan}
            >
              <Rocket className="w-4 h-4 mr-2" />
              {isStartingPlan ? 'Activating Plan...' : 'Start Tracking This Plan'}
            </Button>
            <Button variant="outline" size="lg" onClick={onReset} disabled={isStartingPlan}>
              <Settings2 className="w-4 h-4 mr-2" />
              Adjust Goals
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Info className="w-3 h-3" />
            You can modify this anytime as your progress evolves
          </p>
        </motion.div>
      </div>
    </section>
  );
}
