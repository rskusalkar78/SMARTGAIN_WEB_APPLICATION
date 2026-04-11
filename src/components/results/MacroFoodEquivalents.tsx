import { motion } from 'framer-motion';
import { Utensils, Info } from 'lucide-react';
import { CalculationResult, UserData } from '@/lib/calculations';

interface MacroFoodEquivalentsProps {
  results: CalculationResult;
  userData: UserData;
}

interface MacroData {
  name: string;
  grams: number;
  calories: number;
  percentage: number;
}

interface FoodEquivalent {
  name: string;
  amount: string;
}

function getProteinEquivalents(grams: number, isVegetarian: boolean): FoodEquivalent[] {
  if (isVegetarian) {
    return [
      { name: 'Eggs', amount: `${Math.round(grams / 6)} eggs` },
      { name: 'Paneer', amount: `${Math.round(grams / 18 * 100)}g` },
      { name: 'Dal', amount: `${Math.round(grams / 9 * 100)}g cooked` },
      { name: 'Greek Yogurt', amount: `${Math.round(grams / 10 * 100)}g` },
    ];
  }
  return [
    { name: 'Chicken Breast', amount: `${Math.round(grams / 31 * 100)}g` },
    { name: 'Eggs', amount: `${Math.round(grams / 6)} eggs` },
    { name: 'Fish', amount: `${Math.round(grams / 25 * 100)}g` },
    { name: 'Paneer', amount: `${Math.round(grams / 18 * 100)}g` },
  ];
}

function getCarbEquivalents(grams: number): FoodEquivalent[] {
  return [
    { name: 'Cooked Rice', amount: `${Math.round(grams / 28 * 100)}g` },
    { name: 'Roti', amount: `${Math.round(grams / 15)} pieces` },
    { name: 'Oats', amount: `${Math.round(grams / 66 * 100)}g` },
    { name: 'Sweet Potato', amount: `${Math.round(grams / 20 * 100)}g` },
  ];
}

function getFatEquivalents(grams: number): FoodEquivalent[] {
  return [
    { name: 'Almonds', amount: `${Math.round(grams / 50 * 100)}g` },
    { name: 'Peanut Butter', amount: `${Math.round(grams / 50 * 100)}g` },
    { name: 'Olive Oil', amount: `${Math.round(grams / 100 * 100)}ml` },
    { name: 'Ghee', amount: `${Math.round(grams / 100 * 100)}g` },
  ];
}

export function MacroFoodEquivalents({ results, userData }: MacroFoodEquivalentsProps) {
  // For now, default to vegetarian-friendly examples
  // In a real app, this would come from user preferences
  const isVegetarian = true;
  
  const macroData: MacroData[] = [
    { 
      name: 'Protein', 
      grams: results.protein, 
      calories: results.proteinCalories,
      percentage: Math.round((results.proteinCalories / results.dailyCalories) * 100)
    },
    { 
      name: 'Carbs', 
      grams: results.carbs, 
      calories: results.carbCalories,
      percentage: Math.round((results.carbCalories / results.dailyCalories) * 100)
    },
    { 
      name: 'Fats', 
      grams: results.fats, 
      calories: results.fatCalories,
      percentage: Math.round((results.fatCalories / results.dailyCalories) * 100)
    },
  ];
  
  const equivalents = {
    Protein: getProteinEquivalents(results.protein, isVegetarian),
    Carbs: getCarbEquivalents(results.carbs),
    Fats: getFatEquivalents(results.fats),
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-2xl p-6 mb-12"
    >
      <h3 className="text-xl font-semibold font-display mb-2 flex items-center gap-2">
        <Utensils className="w-5 h-5 text-primary" />
        Daily Macro Breakdown
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Visual breakdown with food equivalents to help you hit your targets
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        {macroData.map((macro, index) => (
          <motion.div
            key={macro.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="text-center"
          >
            {/* SVG Ring */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={`url(#gradient-${index})`}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(macro.percentage / 100) * 352} 352`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{macro.percentage}%</span>
              </div>
            </div>
            
            <div className="font-semibold text-lg">{macro.name}</div>
            <div className="text-muted-foreground mb-3">
              {macro.grams}g • {macro.calories} kcal
            </div>
            
            {/* Food Equivalents */}
            <div className="text-left bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Equivalent to approx:
              </div>
              <div className="space-y-1">
                {equivalents[macro.name as keyof typeof equivalents].slice(0, 2).map((food, foodIndex) => (
                  <div key={foodIndex} className="text-xs flex justify-between">
                    <span className="text-muted-foreground">{food.name}</span>
                    <span className="font-medium">{food.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
