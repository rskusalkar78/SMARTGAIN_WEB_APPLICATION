// SmartGain Frontend - Meal Card Component
// Display meal details with expandable view and completion tracking

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Meal, MealType } from '@/api/types';

interface MealCardProps {
  meal: Meal;
  mealType: MealType;
  date: string;
}

const MealCard = ({ meal, mealType, date }: MealCardProps) => {
  // State for expandable view (Req 10.4)
  const [isOpen, setIsOpen] = useState(false);
  
  // State for completion tracking (Req 10.7)
  const [isCompleted, setIsCompleted] = useState(() => {
    // Check localStorage for completion status
    const key = `meal-completed-${date}-${mealType}`;
    return localStorage.getItem(key) === 'true';
  });

  // Handle completion toggle
  const handleCompletionToggle = (checked: boolean) => {
    setIsCompleted(checked);
    const key = `meal-completed-${date}-${mealType}`;
    if (checked) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  };

  // Calculate total macros for display (Req 10.3)
  const totalMacros = meal.protein + meal.carbs + meal.fats;

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`meal-${date}-${mealType}`}
                  checked={isCompleted}
                  onCheckedChange={handleCompletionToggle}
                  aria-label={`Mark ${meal.name} as completed`}
                />
                <CardTitle className={isCompleted ? 'line-through' : ''}>
                  {meal.name}
                </CardTitle>
              </div>
              {/* Show calorie and macro information (Req 10.3) */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary">
                  {meal.calories} cal
                </Badge>
                <Badge variant="outline">
                  P: {meal.protein}g
                </Badge>
                <Badge variant="outline">
                  C: {meal.carbs}g
                </Badge>
                <Badge variant="outline">
                  F: {meal.fats}g
                </Badge>
              </div>
            </div>
            
            {/* Expandable trigger (Req 10.4) */}
            <CollapsibleTrigger asChild>
              <button
                className="ml-2 rounded-md p-2 hover:bg-muted transition-colors"
                aria-label={isOpen ? 'Collapse meal details' : 'Expand meal details'}
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        {/* Expandable content with ingredients and instructions */}
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Ingredients section */}
            <div>
              <h4 className="font-semibold mb-2">Ingredients</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            {/* Preparation instructions section */}
            <div>
              <h4 className="font-semibold mb-2">Preparation</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {meal.instructions}
              </p>
            </div>

            {/* Nutritional breakdown */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Nutritional Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Calories:</span>
                  <span className="ml-2 font-medium">{meal.calories} kcal</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Macros:</span>
                  <span className="ml-2 font-medium">{totalMacros}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="ml-2 font-medium">{meal.protein}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="ml-2 font-medium">{meal.carbs}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fats:</span>
                  <span className="ml-2 font-medium">{meal.fats}g</span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default MealCard;
