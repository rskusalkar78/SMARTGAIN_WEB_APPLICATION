import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Ruler, Weight, Target, Calendar, Activity, 
  Dumbbell, Home, Zap, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UserData } from '@/lib/calculations';
import { CalculatorResults } from '@/api/types';

interface CalculatorProps {
  onCalculate: (data: UserData, results: CalculatorResults) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

type Step = 1 | 2 | 3;

export function Calculator({ onCalculate, onBack, isLoading = false, error = null }: CalculatorProps) {
  const [step, setStep] = useState<Step>(1);
  const [heightInput, setHeightInput] = useState<string>('');
  const [formData, setFormData] = useState<Partial<UserData>>({
    gender: 'male',
    activityLevel: 'moderate',
    workoutPreference: 'gym',
    fitnessLevel: 'beginner',
  });

  const updateField = <K extends keyof UserData>(field: K, value: UserData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (isFormComplete()) {
      onCalculate(formData as UserData, {} as CalculatorResults); // Results will be passed back from parent
    }
  };

  const isFormComplete = () => {
    return (
      formData.height &&
      formData.currentWeight &&
      formData.targetWeightGain &&
      formData.timeframe &&
      formData.age &&
      formData.gender &&
      formData.activityLevel &&
      formData.workoutPreference &&
      formData.fitnessLevel
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.height && formData.currentWeight && formData.age && formData.gender;
      case 2:
        return formData.targetWeightGain && formData.timeframe && formData.activityLevel;
      case 3:
        return formData.workoutPreference && formData.fitnessLevel;
      default:
        return false;
    }
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
    { value: 'light', label: 'Light', desc: '1-3 days/week' },
    { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
    { value: 'active', label: 'Active', desc: '6-7 days/week' },
    { value: 'very_active', label: 'Very Active', desc: 'Athlete level' },
  ] as const;

  const fitnessLevels = [
    { value: 'beginner', label: 'Beginner', desc: '0-1 year training' },
    { value: 'intermediate', label: 'Intermediate', desc: '1-3 years training' },
    { value: 'advanced', label: 'Advanced', desc: '3+ years training' },
  ] as const;

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 bg-background">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-4xl font-bold font-display mb-3">
            Let's Build Your Plan
          </h2>
          <p className="text-muted-foreground text-lg">
            Step {step} of 3
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full mb-10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-warning rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Form Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card rounded-2xl p-8"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold font-display flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Your Body Stats
              </h3>

              {/* Gender Selection */}
              <div className="space-y-3">
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as const).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => updateField('gender', gender)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-center font-medium capitalize',
                        formData.gender === gender
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  icon={<User className="w-4 h-4" />}
                  suffix="years"
                  value={formData.age || ''}
                  onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Height */}
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="text"
                  placeholder="e.g. 5.8 (feet.inches)"
                  icon={<Ruler className="w-4 h-4" />}
                  suffix="ft.in"
                  value={heightInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setHeightInput(val);
                    const parts = val.split('.');
                    const feet = parseInt(parts[0]) || 0;
                    const inches = parts[1] ? parseInt(parts[1]) : 0;
                    const totalInches = (feet * 12) + inches;
                    updateField('height', Math.round(totalInches * 2.54));
                  }}
                />
              </div>

              {/* Current Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight">Current Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Enter your weight"
                  icon={<Weight className="w-4 h-4" />}
                  suffix="kg"
                  value={formData.currentWeight || ''}
                  onChange={(e) => updateField('currentWeight', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold font-display flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Your Goals
              </h3>

              {/* Target Weight Gain */}
              <div className="space-y-2">
                <Label htmlFor="targetGain">Target Weight Gain</Label>
                <Input
                  id="targetGain"
                  type="number"
                  step="0.5"
                  placeholder="How much do you want to gain?"
                  icon={<Target className="w-4 h-4" />}
                  suffix="kg"
                  value={formData.targetWeightGain || ''}
                  onChange={(e) => updateField('targetWeightGain', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Timeframe */}
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Input
                  id="timeframe"
                  type="number"
                  placeholder="How many weeks?"
                  icon={<Calendar className="w-4 h-4" />}
                  suffix="weeks"
                  value={formData.timeframe || ''}
                  onChange={(e) => updateField('timeframe', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Activity Level */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity Level
                </Label>
                <div className="grid gap-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => updateField('activityLevel', level.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        formData.activityLevel === level.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-muted-foreground">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold font-display flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                Workout Preferences
              </h3>

              {/* Workout Location */}
              <div className="space-y-3">
                <Label>Where do you prefer to workout?</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateField('workoutPreference', 'gym')}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all duration-200 text-center',
                      formData.workoutPreference === 'gym'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Dumbbell className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Gym</div>
                    <div className="text-sm text-muted-foreground">Full equipment access</div>
                  </button>
                  <button
                    onClick={() => updateField('workoutPreference', 'home')}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all duration-200 text-center',
                      formData.workoutPreference === 'home'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Home className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Home</div>
                    <div className="text-sm text-muted-foreground">Minimal equipment</div>
                  </button>
                </div>
              </div>

              {/* Fitness Level */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Fitness Level
                </Label>
                <div className="grid gap-2">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => updateField('fitnessLevel', level.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        formData.fitnessLevel === level.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-muted-foreground">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep((step - 1) as Step)} disabled={isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            ) : (
              <div />
            )}
            
            {step < 3 ? (
              <Button 
                variant="hero" 
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canProceed() || isLoading}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                variant="hero" 
                onClick={handleSubmit}
                disabled={!isFormComplete() || isLoading}
              >
                {isLoading ? 'Calculating...' : 'Calculate My Plan'}
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
