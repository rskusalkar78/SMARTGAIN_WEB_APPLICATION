import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '@/components/Hero';
import { Calculator } from '@/components/Calculator';
import { Results } from '@/components/Results';
import { WhyDifferent } from '@/components/landing/WhyDifferent';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { Footer } from '@/components/landing/Footer';
import { 
  UserData, 
  CalculationResult, 
  WorkoutPlan,
  calculateDailyPlan,
  generateWorkoutPlan 
} from '@/lib/calculations';
import { CalculatorResults } from '@/api/types';
import { useCalculator } from '@/hooks/useCalculator';
import { useAuth } from '@/hooks/useAuth';
import { userApi } from '@/api/endpoints';

type View = 'hero' | 'calculator' | 'results';

export function Index() {
  const [currentView, setCurrentView] = useState<View>('hero');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);

  // Calculator mutation hook
  const calculatorMutation = useCalculator();
  
  // Auth hook
  const { isAuthenticated } = useAuth();
  
  // Navigation hook
  const navigate = useNavigate();

  const handleGetStarted = () => {
    setCurrentView('calculator');
  };

  const applyPlanAndShowResults = (
    data: UserData,
    calculatedResults: CalculationResult,
    plan: WorkoutPlan
  ) => {
    setResults(calculatedResults);
    setWorkoutPlan(plan);
    setCurrentView('results');
  };

  const handleCalculate = async (data: UserData) => {
    setUserData(data);
    
    try {
      // Try backend API first
      const apiResults = await calculatorMutation.mutateAsync(data);
      
      // Convert API results to local CalculationResult format for Results component
      const calculatedResults: CalculationResult = {
        bmr: 0,
        tdee: 0,
        dailyCalories: apiResults.dailyCalories,
        weeklyCalories: apiResults.dailyCalories * 7,
        calorieSurplus: 0,
        protein: apiResults.protein,
        carbs: apiResults.carbs,
        fats: apiResults.fats,
        proteinCalories: apiResults.protein * 4,
        carbCalories: apiResults.carbs * 4,
        fatCalories: apiResults.fats * 9,
        weeklyGain: data.targetWeightGain / data.timeframe,
        isHealthyRate: (data.targetWeightGain / data.timeframe) <= 0.5,
        warning: undefined,
      };
      
      const plan = generateWorkoutPlan(data.workoutPreference, data.fitnessLevel);
      
      // If user is authenticated, save results to profile then redirect or show results
      if (isAuthenticated) {
        try {
          await userApi.updateProfile({
            goals: {
              currentWeight: data.currentWeight,
              targetWeight: data.currentWeight + data.targetWeightGain,
              weeklyGainGoal: data.targetWeightGain / data.timeframe,
              dailyCalories: apiResults.dailyCalories,
              dailyProtein: apiResults.protein,
              dailyCarbs: apiResults.carbs,
              dailyFats: apiResults.fats,
            },
          });
          navigate('/app/dashboard');
          return;
        } catch (profileError) {
          console.error('Failed to save results to profile:', profileError);
        }
      }
      
      applyPlanAndShowResults(data, calculatedResults, plan);
    } catch (error) {
      // API failed (e.g. backend not running): fall back to local calculation so user still sees a plan
      console.warn('API calculation failed, using local calculation:', error);
      calculatorMutation.reset();
      const calculatedResults = calculateDailyPlan(data);
      const plan = generateWorkoutPlan(data.workoutPreference, data.fitnessLevel);
      applyPlanAndShowResults(data, calculatedResults, plan);
    }
  };

  const handleRecalculate = async (newData: Partial<UserData>) => {
    if (userData) {
      const updatedUserData = { ...userData, ...newData };
      setUserData(updatedUserData);
      
      try {
        const apiResults = await calculatorMutation.mutateAsync(updatedUserData);
        
        const calculatedResults: CalculationResult = {
          bmr: 0,
          tdee: 0,
          dailyCalories: apiResults.dailyCalories,
          weeklyCalories: apiResults.dailyCalories * 7,
          calorieSurplus: 0,
          protein: apiResults.protein,
          carbs: apiResults.carbs,
          fats: apiResults.fats,
          proteinCalories: apiResults.protein * 4,
          carbCalories: apiResults.carbs * 4,
          fatCalories: apiResults.fats * 9,
          weeklyGain: updatedUserData.targetWeightGain / updatedUserData.timeframe,
          isHealthyRate: (updatedUserData.targetWeightGain / updatedUserData.timeframe) <= 0.5,
          warning: undefined,
        };
        
        const plan = generateWorkoutPlan(updatedUserData.workoutPreference, updatedUserData.fitnessLevel);
        setResults(calculatedResults);
        setWorkoutPlan(plan);
      } catch (error) {
        console.error('Recalculation failed:', error);
      }
    }
  };


  const handleReset = () => {
    setCurrentView('hero');
    setUserData(null);
    setResults(null);
    setWorkoutPlan(null);
  };

  const handleBackToHero = () => {
    setCurrentView('hero');
  };

  return (
    <main className="dark min-h-screen bg-background">
      {currentView === 'hero' && (
        <>
          <Hero onGetStarted={handleGetStarted} />
          <WhyDifferent />
          <HowItWorks />
          <Testimonials />
          <Footer />
        </>
      )}
      {currentView === 'calculator' && (
        <Calculator 
          onCalculate={handleCalculate} 
          onBack={handleBackToHero}
          isLoading={calculatorMutation.isPending}
          error={calculatorMutation.error ? 'Failed to calculate. Please try again.' : null}
        />
      )}
      {currentView === 'results' && userData && results && workoutPlan && (
        <Results 
          userData={userData} 
          results={results} 
          workoutPlan={workoutPlan}
          onReset={handleReset}
          onRecalculate={handleRecalculate}
        />
      )}
    </main>
  );
};

export default Index;
