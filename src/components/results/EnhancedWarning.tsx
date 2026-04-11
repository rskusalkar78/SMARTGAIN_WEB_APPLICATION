import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserData, CalculationResult, calculateDailyPlan } from '@/lib/calculations';
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EnhancedWarningProps {
  userData: UserData;
  results: CalculationResult;
  onMakeSafer: (newTimeframe: number) => void;
  hasAppliedSaferPlan?: boolean;
}

export function EnhancedWarning({ userData, results, onMakeSafer, hasAppliedSaferPlan }: EnhancedWarningProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showSaferPlanDialog, setShowSaferPlanDialog] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  if (!results.warning || hasAppliedSaferPlan) return null;
  
  // Calculate safer alternative
  const targetGainRate = 0.4; // kg per week (safe rate)
  const saferTimeframe = Math.ceil(userData.targetWeightGain / targetGainRate);
  const saferWeeklyGain = userData.targetWeightGain / saferTimeframe;
  const saferDailySurplus = Math.round((userData.targetWeightGain * 7700) / (saferTimeframe * 7));
  
  // Calculate safer plan results
  const saferUserData: UserData = {
    ...userData,
    timeframe: saferTimeframe,
  };
  const saferPlanResults = calculateDailyPlan(saferUserData);
  
  const currentSurplus = results.calorieSurplus;
  const surplusReduction = currentSurplus - saferDailySurplus;

  // Handle click - show dialog first
  const handleMakeSaferClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Show the safer plan dialog
    setShowSaferPlanDialog(true);
  };

  // Auto-apply the safer plan when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setShowSaferPlanDialog(open);
  };

  // Also handle mousedown as backup
  const handleMakeSaferMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle hover with delay to prevent flickering
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    // Add small delay before hiding to prevent flickering on click
    timeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 200);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 p-5 rounded-xl bg-warning/10 border border-warning/30"
    >
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-warning mb-1">Aggressive Gain Rate Detected</p>
          <p className="text-sm text-muted-foreground">{results.warning}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 relative">
        {/* Preview positioned absolutely to prevent layout shift */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 mb-2 p-4 rounded-lg bg-background/95 backdrop-blur-sm border border-border shadow-lg pointer-events-auto z-30 w-full sm:w-auto sm:min-w-[400px]"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <p className="text-sm font-medium mb-3">What changes with a safer plan:</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">New timeline:</span>
                  <span className="font-semibold text-accent">{saferTimeframe} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Weekly gain:</span>
                  <span className="font-semibold text-accent">{saferWeeklyGain.toFixed(2)} kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Daily surplus:</span>
                  <span className="font-semibold text-accent">{saferDailySurplus} kcal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Reduction:</span>
                  <span className="font-semibold text-accent">-{surplusReduction} kcal/day</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          ref={buttonRef}
          variant="default"
          size="sm"
          className="bg-accent hover:bg-accent/90 active:bg-accent/80 text-accent-foreground cursor-pointer relative z-20 pointer-events-auto touch-manipulation"
          onClick={handleMakeSaferClick}
          onMouseDown={handleMakeSaferMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          type="button"
          disabled={hasAppliedSaferPlan}
          aria-label="Make plan safer by extending timeline"
        >
          <Shield className="w-4 h-4 mr-2 pointer-events-none" />
          {hasAppliedSaferPlan ? 'Safer plan applied' : 'Make It Safer'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-warning/50 text-warning hover:bg-warning/10"
          disabled={hasAppliedSaferPlan}
        >
          Continue Anyway
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-3">
        💡 We support your goals while prioritizing your health. Either choice is valid.
      </p>
      {hasAppliedSaferPlan && (
        <p className="text-xs text-accent mt-2 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Safer plan has been applied to your results.
        </p>
      )}

      {/* Safer Plan Dialog */}
      <Dialog open={showSaferPlanDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-accent" />
              Your Safer Weight Gain Plan
            </DialogTitle>
            <DialogDescription>
              We've adjusted your plan to a healthier gain rate. Here's what changes:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Comparison Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Current Plan */}
              <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold text-sm">Current Plan</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-semibold">{userData.timeframe} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly Gain:</span>
                    <span className="font-semibold text-warning">{results.weeklyGain.toFixed(2)} kg/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Calories:</span>
                    <span className="font-semibold">{results.dailyCalories} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Surplus:</span>
                    <span className="font-semibold">{results.calorieSurplus} kcal</span>
                  </div>
                </div>
              </div>

              {/* Safer Plan */}
              <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-sm">Safer Plan</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-semibold text-accent">{saferTimeframe} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly Gain:</span>
                    <span className="font-semibold text-accent">{saferWeeklyGain.toFixed(2)} kg/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Calories:</span>
                    <span className="font-semibold text-accent">{saferPlanResults.dailyCalories} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Surplus:</span>
                    <span className="font-semibold text-accent">{saferDailySurplus} kcal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Benefits of the Safer Plan
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span><strong>Healthier rate:</strong> {saferWeeklyGain.toFixed(2)} kg/week is within the recommended 0.25-0.5 kg/week range</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span><strong>Less fat gain:</strong> Slower rate promotes more muscle vs. fat gain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span><strong>More sustainable:</strong> Easier to maintain long-term eating habits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span><strong>Better recovery:</strong> Lower surplus reduces stress on your body</span>
                </li>
              </ul>
            </div>

            {/* Macro Comparison */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border border-border">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Protein</div>
                <div className="text-lg font-semibold">{saferPlanResults.protein}g</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {saferPlanResults.protein > results.protein ? '+' : ''}
                  {(saferPlanResults.protein - results.protein).toFixed(0)}g
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Carbs</div>
                <div className="text-lg font-semibold">{saferPlanResults.carbs}g</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {saferPlanResults.carbs > results.carbs ? '+' : ''}
                  {(saferPlanResults.carbs - results.carbs).toFixed(0)}g
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Fats</div>
                <div className="text-lg font-semibold">{saferPlanResults.fats}g</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {saferPlanResults.fats > results.fats ? '+' : ''}
                  {(saferPlanResults.fats - results.fats).toFixed(0)}g
                </div>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                <strong>Timeline change:</strong> Your plan extends from <strong>{userData.timeframe} weeks</strong> to <strong className="text-accent">{saferTimeframe} weeks</strong> (+{saferTimeframe - userData.timeframe} weeks) for a healthier, more sustainable approach.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaferPlanDialog(false)}
            >
              Keep Current Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
