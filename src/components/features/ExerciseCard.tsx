// SmartGain Frontend - Exercise Card Component
// Display exercise details with expandable view and completion tracking

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Play, Clock } from 'lucide-react';
import { Exercise } from '@/api/types';

interface ExerciseCardProps {
  exercise: Exercise;
  date: string;
  exerciseIndex: number;
}

const ExerciseCard = ({ exercise, date, exerciseIndex }: ExerciseCardProps) => {
  // State for expandable view (Req 11.4)
  const [isOpen, setIsOpen] = useState(false);
  
  // State for completion tracking (Req 11.7)
  const [isCompleted, setIsCompleted] = useState(() => {
    // Check localStorage for completion status
    const key = `exercise-completed-${date}-${exerciseIndex}`;
    return localStorage.getItem(key) === 'true';
  });

  // Handle completion toggle
  const handleCompletionToggle = (checked: boolean) => {
    setIsCompleted(checked);
    const key = `exercise-completed-${date}-${exerciseIndex}`;
    if (checked) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  };

  // Format rest period for display
  const formatRestPeriod = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`exercise-${date}-${exerciseIndex}`}
                  checked={isCompleted}
                  onCheckedChange={handleCompletionToggle}
                  aria-label={`Mark ${exercise.name} as completed`}
                />
                <CardTitle className={isCompleted ? 'line-through' : ''}>
                  {exercise.name}
                </CardTitle>
              </div>
              {/* Show exercise details (sets, reps, rest) (Req 11.3) */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary">
                  {exercise.sets} sets
                </Badge>
                <Badge variant="outline">
                  {exercise.reps} reps
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRestPeriod(exercise.restPeriod)}
                </Badge>
              </div>
            </div>
            
            {/* Expandable trigger (Req 11.4) */}
            <CollapsibleTrigger asChild>
              <button
                className="ml-2 rounded-md p-2 hover:bg-muted transition-colors"
                aria-label={isOpen ? 'Collapse exercise details' : 'Expand exercise details'}
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

        {/* Expandable content with instructions and form tips */}
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Instructions section */}
            <div>
              <h4 className="font-semibold mb-2">Instructions & Form Tips</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {exercise.instructions}
              </p>
            </div>

            {/* Video section (if available) */}
            {exercise.videoUrl && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Video Guide
                </h4>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <a 
                    href={exercise.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Watch Exercise Demo
                  </a>
                </div>
              </div>
            )}

            {/* Exercise breakdown */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Exercise Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Sets:</span>
                  <span className="ml-2 font-medium">{exercise.sets}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reps:</span>
                  <span className="ml-2 font-medium">{exercise.reps}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rest:</span>
                  <span className="ml-2 font-medium">{formatRestPeriod(exercise.restPeriod)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Time:</span>
                  <span className="ml-2 font-medium">
                    ~{Math.ceil((exercise.sets * exercise.reps * 3 + exercise.restPeriod * (exercise.sets - 1)) / 60)}min
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ExerciseCard;