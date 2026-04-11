import { motion } from 'framer-motion';
import { TrendingUp, Info, HelpCircle } from 'lucide-react';
import { CalculationResult } from '@/lib/calculations';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MetabolicProfileProps {
  results: CalculationResult;
}

interface TooltipState {
  bmr: boolean;
  tdee: boolean;
}

export function MetabolicProfile({ results }: MetabolicProfileProps) {
  const [tooltips, setTooltips] = useState<TooltipState>({ bmr: false, tdee: false });
  
  const toggleTooltip = (key: keyof TooltipState) => {
    setTooltips(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card rounded-2xl p-6 mb-12"
    >
      <h3 className="text-xl font-semibold font-display mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Your Metabolic Profile
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* BMR */}
          <div className="relative p-3 rounded-lg bg-muted/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Basal Metabolic Rate (BMR)</span>
                <button
                  onClick={() => toggleTooltip('bmr')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <span className="font-semibold">{results.bmr} kcal</span>
            </div>
            {tooltips.bmr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-2 rounded bg-primary/10 text-sm text-muted-foreground"
              >
                <Info className="w-3 h-3 inline mr-1 text-primary" />
                This is the energy your body burns at complete rest – just to keep you alive (breathing, circulation, cell production).
              </motion.div>
            )}
          </div>
          
          {/* TDEE */}
          <div className="relative p-3 rounded-lg bg-muted/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Daily Energy Expenditure</span>
                <button
                  onClick={() => toggleTooltip('tdee')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <span className="font-semibold">{results.tdee} kcal</span>
            </div>
            {tooltips.tdee && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-2 rounded bg-primary/10 text-sm text-muted-foreground"
              >
                <Info className="w-3 h-3 inline mr-1 text-primary" />
                Your BMR plus all daily activities (walking, exercise, work). This is your maintenance calories.
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">Required Daily Surplus</span>
            <span className="font-semibold text-primary">+{results.calorieSurplus} kcal</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">Weekly Calorie Target</span>
            <span className="font-semibold">{results.weeklyCalories.toLocaleString()} kcal</span>
          </div>
        </div>
      </div>
      
      {/* Micro-summary */}
      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your body needs approximately <span className="font-semibold text-foreground">{results.tdee.toLocaleString()} kcal/day</span> before weight gain. 
            We're adding <span className="font-semibold text-primary">+{results.calorieSurplus} kcal</span> daily surplus to fuel muscle growth.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
