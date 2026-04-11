export interface UserData {
  height: number; // cm
  currentWeight: number; // kg
  targetWeightGain: number; // kg
  timeframe: number; // weeks
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  workoutPreference: 'home' | 'gym';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface CalculationResult {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  weeklyCalories: number;
  calorieSurplus: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  proteinCalories: number;
  carbCalories: number;
  fatCalories: number;
  weeklyGain: number; // kg per week
  isHealthyRate: boolean;
  warning?: string;
}

// Activity level multipliers for TDEE
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Calculate BMR using Mifflin-St Jeor equation
export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(bmr: number, activityLevel: keyof typeof activityMultipliers): number {
  return bmr * activityMultipliers[activityLevel];
}

// Main calculation function
export function calculateDailyPlan(userData: UserData): CalculationResult {
  const bmr = calculateBMR(userData.currentWeight, userData.height, userData.age, userData.gender);
  const tdee = calculateTDEE(bmr, userData.activityLevel);
  
  // Calculate required surplus
  // 1 kg of weight gain requires approximately 7700 calories surplus
  const totalCaloriesNeeded = userData.targetWeightGain * 7700;
  const totalDays = userData.timeframe * 7;
  const dailySurplus = totalCaloriesNeeded / totalDays;
  
  // Calculate weekly gain rate
  const weeklyGain = userData.targetWeightGain / userData.timeframe;
  
  // Check if the rate is healthy (0.25-0.5 kg/week is considered healthy)
  const isHealthyRate = weeklyGain <= 0.5 && weeklyGain >= 0.1;
  
  let warning: string | undefined;
  if (weeklyGain > 0.5) {
    warning = `Gaining ${weeklyGain.toFixed(2)} kg/week is aggressive. Consider extending your timeframe for healthier results.`;
  } else if (weeklyGain > 0.75) {
    warning = `This rate of gain may lead to excess fat. We recommend 0.25-0.5 kg per week.`;
  }
  
  const dailyCalories = Math.round(tdee + dailySurplus);
  
  // Calculate macros based on target weight for protein calculation
  const targetWeight = userData.currentWeight + userData.targetWeightGain;
  
  // Protein: 1.6-2.2g per kg of target body weight (using 1.8 for moderate gain)
  const protein = Math.round(targetWeight * 1.8);
  
  // Fat: 25-30% of total calories (using 27%)
  const fatCalories = dailyCalories * 0.27;
  const fats = Math.round(fatCalories / 9);
  
  // Remaining calories from carbs
  const proteinCalories = protein * 4;
  const carbCalories = dailyCalories - proteinCalories - fatCalories;
  const carbs = Math.round(carbCalories / 4);
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories,
    weeklyCalories: dailyCalories * 7,
    calorieSurplus: Math.round(dailySurplus),
    protein,
    carbs,
    fats,
    proteinCalories: Math.round(proteinCalories),
    carbCalories: Math.round(carbCalories),
    fatCalories: Math.round(fatCalories),
    weeklyGain,
    isHealthyRate,
    warning,
  };
}

export interface WorkoutPlan {
  name: string;
  description: string;
  daysPerWeek: number;
  split: DayPlan[];
  tips: string[];
}

export interface DayPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
  isRestDay: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

export function generateWorkoutPlan(
  preference: 'home' | 'gym',
  level: 'beginner' | 'intermediate' | 'advanced'
): WorkoutPlan {
  if (preference === 'gym') {
    return generateGymPlan(level);
  } else {
    return generateHomePlan(level);
  }
}

function generateGymPlan(level: 'beginner' | 'intermediate' | 'advanced'): WorkoutPlan {
  const plans: Record<string, WorkoutPlan> = {
    beginner: {
      name: 'Full Body Foundation',
      description: 'A 3-day full body program perfect for building a strong foundation and muscle mass.',
      daysPerWeek: 3,
      split: [
        {
          day: 'Day 1 - Full Body A',
          focus: 'Compound Movements',
          isRestDay: false,
          exercises: [
            { name: 'Barbell Squat', sets: 3, reps: '8-10', rest: '2-3 min' },
            { name: 'Bench Press', sets: 3, reps: '8-10', rest: '2 min' },
            { name: 'Bent Over Row', sets: 3, reps: '8-10', rest: '2 min' },
            { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '2 min' },
            { name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '90 sec' },
          ],
        },
        {
          day: 'Day 2 - Rest',
          focus: 'Recovery',
          isRestDay: true,
          exercises: [],
        },
        {
          day: 'Day 3 - Full Body B',
          focus: 'Compound Movements',
          isRestDay: false,
          exercises: [
            { name: 'Deadlift', sets: 3, reps: '6-8', rest: '3 min' },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '2 min' },
            { name: 'Seated Cable Row', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Leg Press', sets: 3, reps: '10-12', rest: '2 min' },
            { name: 'Face Pulls', sets: 3, reps: '12-15', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 4 - Rest',
          focus: 'Recovery',
          isRestDay: true,
          exercises: [],
        },
        {
          day: 'Day 5 - Full Body C',
          focus: 'Compound Movements',
          isRestDay: false,
          exercises: [
            { name: 'Front Squat', sets: 3, reps: '8-10', rest: '2 min' },
            { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Pull-ups/Assisted', sets: 3, reps: '6-10', rest: '2 min' },
            { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '2 min' },
            { name: 'Dips/Assisted', sets: 3, reps: '8-12', rest: '90 sec' },
          ],
        },
      ],
      tips: [
        'Focus on proper form before increasing weight',
        'Progressive overload: add 2.5kg when you hit the top of rep range',
        'Get 7-9 hours of sleep for optimal recovery',
        'Eat within 2 hours after your workout',
      ],
    },
    intermediate: {
      name: 'Push/Pull/Legs Split',
      description: 'A 5-day PPL program for building serious muscle mass with balanced volume.',
      daysPerWeek: 5,
      split: [
        {
          day: 'Day 1 - Push',
          focus: 'Chest, Shoulders, Triceps',
          isRestDay: false,
          exercises: [
            { name: 'Bench Press', sets: 4, reps: '6-8', rest: '2-3 min' },
            { name: 'Overhead Press', sets: 4, reps: '8-10', rest: '2 min' },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Lateral Raises', sets: 4, reps: '12-15', rest: '60 sec' },
            { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 2 - Pull',
          focus: 'Back, Biceps, Rear Delts',
          isRestDay: false,
          exercises: [
            { name: 'Deadlift', sets: 4, reps: '5-6', rest: '3 min' },
            { name: 'Weighted Pull-ups', sets: 4, reps: '6-8', rest: '2 min' },
            { name: 'Barbell Rows', sets: 4, reps: '8-10', rest: '2 min' },
            { name: 'Face Pulls', sets: 4, reps: '12-15', rest: '60 sec' },
            { name: 'Barbell Curls', sets: 3, reps: '10-12', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 3 - Legs',
          focus: 'Quads, Hamstrings, Glutes',
          isRestDay: false,
          exercises: [
            { name: 'Barbell Squat', sets: 4, reps: '6-8', rest: '3 min' },
            { name: 'Romanian Deadlift', sets: 4, reps: '8-10', rest: '2 min' },
            { name: 'Leg Press', sets: 3, reps: '10-12', rest: '2 min' },
            { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: '90 sec' },
            { name: 'Calf Raises', sets: 4, reps: '12-15', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 4 - Rest',
          focus: 'Recovery',
          isRestDay: true,
          exercises: [],
        },
        {
          day: 'Day 5 - Upper',
          focus: 'Full Upper Body',
          isRestDay: false,
          exercises: [
            { name: 'Incline Bench Press', sets: 4, reps: '8-10', rest: '2 min' },
            { name: 'Weighted Chin-ups', sets: 4, reps: '6-8', rest: '2 min' },
            { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Cable Rows', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Dips', sets: 3, reps: '8-12', rest: '90 sec' },
          ],
        },
        {
          day: 'Day 6 - Lower',
          focus: 'Full Lower Body',
          isRestDay: false,
          exercises: [
            { name: 'Front Squat', sets: 4, reps: '8-10', rest: '2 min' },
            { name: 'Hip Thrusts', sets: 4, reps: '10-12', rest: '2 min' },
            { name: 'Bulgarian Split Squats', sets: 3, reps: '10 each', rest: '90 sec' },
            { name: 'Leg Curls', sets: 3, reps: '12-15', rest: '60 sec' },
            { name: 'Calf Raises', sets: 4, reps: '12-15', rest: '60 sec' },
          ],
        },
      ],
      tips: [
        'Track your lifts and aim for progressive overload',
        'Deload every 4-6 weeks by reducing volume 40-50%',
        'Consider creatine supplementation for enhanced performance',
        'Time your biggest meal around your workout',
      ],
    },
    advanced: {
      name: 'Power Building Program',
      description: 'A 6-day intensive program combining strength and hypertrophy for maximum gains.',
      daysPerWeek: 6,
      split: [
        {
          day: 'Day 1 - Heavy Upper',
          focus: 'Strength Focus',
          isRestDay: false,
          exercises: [
            { name: 'Bench Press', sets: 5, reps: '3-5', rest: '3-4 min' },
            { name: 'Weighted Pull-ups', sets: 5, reps: '3-5', rest: '3 min' },
            { name: 'Overhead Press', sets: 4, reps: '5-6', rest: '2-3 min' },
            { name: 'Pendlay Rows', sets: 4, reps: '5-6', rest: '2-3 min' },
            { name: 'Close Grip Bench', sets: 3, reps: '6-8', rest: '2 min' },
          ],
        },
        {
          day: 'Day 2 - Heavy Lower',
          focus: 'Strength Focus',
          isRestDay: false,
          exercises: [
            { name: 'Back Squat', sets: 5, reps: '3-5', rest: '3-4 min' },
            { name: 'Conventional Deadlift', sets: 4, reps: '3-5', rest: '4 min' },
            { name: 'Front Squat', sets: 3, reps: '6-8', rest: '2-3 min' },
            { name: 'Barbell Hip Thrusts', sets: 3, reps: '8-10', rest: '2 min' },
            { name: 'Standing Calf Raises', sets: 4, reps: '8-10', rest: '90 sec' },
          ],
        },
        {
          day: 'Day 3 - Push Hypertrophy',
          focus: 'Volume Focus',
          isRestDay: false,
          exercises: [
            { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', rest: '90 sec' },
            { name: 'Cable Flyes', sets: 4, reps: '12-15', rest: '60 sec' },
            { name: 'Seated DB Press', sets: 4, reps: '10-12', rest: '90 sec' },
            { name: 'Lateral Raises', sets: 5, reps: '15-20', rest: '45 sec' },
            { name: 'Overhead Tricep Extension', sets: 4, reps: '12-15', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 4 - Pull Hypertrophy',
          focus: 'Volume Focus',
          isRestDay: false,
          exercises: [
            { name: 'Chest Supported Rows', sets: 4, reps: '10-12', rest: '90 sec' },
            { name: 'Lat Pulldowns', sets: 4, reps: '10-12', rest: '90 sec' },
            { name: 'Seated Cable Rows', sets: 4, reps: '12-15', rest: '60 sec' },
            { name: 'Reverse Pec Deck', sets: 4, reps: '15-20', rest: '45 sec' },
            { name: 'Hammer Curls', sets: 4, reps: '12-15', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 5 - Legs Hypertrophy',
          focus: 'Volume Focus',
          isRestDay: false,
          exercises: [
            { name: 'Hack Squat', sets: 4, reps: '10-12', rest: '2 min' },
            { name: 'Romanian Deadlift', sets: 4, reps: '10-12', rest: '2 min' },
            { name: 'Leg Press', sets: 4, reps: '12-15', rest: '90 sec' },
            { name: 'Leg Curls', sets: 4, reps: '12-15', rest: '60 sec' },
            { name: 'Leg Extensions', sets: 4, reps: '12-15', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 6 - Arms & Shoulders',
          focus: 'Detail Work',
          isRestDay: false,
          exercises: [
            { name: 'Arnold Press', sets: 4, reps: '10-12', rest: '90 sec' },
            { name: 'EZ Bar Curls', sets: 4, reps: '10-12', rest: '60 sec' },
            { name: 'Skull Crushers', sets: 4, reps: '10-12', rest: '60 sec' },
            { name: 'Cable Lateral Raises', sets: 4, reps: '15-20', rest: '45 sec' },
            { name: 'Concentration Curls', sets: 3, reps: '12-15', rest: '45 sec' },
          ],
        },
      ],
      tips: [
        'Periodize your training: 3 weeks intensity, 1 week deload',
        'Consider working with a coach for form checks',
        'Sleep and nutrition are 70% of your results',
        'Use RPE (Rate of Perceived Exertion) to auto-regulate intensity',
      ],
    },
  };

  return plans[level];
}

function generateHomePlan(level: 'beginner' | 'intermediate' | 'advanced'): WorkoutPlan {
  const plans: Record<string, WorkoutPlan> = {
    beginner: {
      name: 'Bodyweight Basics',
      description: 'A 3-day full body program using minimal equipment for building foundational strength.',
      daysPerWeek: 3,
      split: [
        {
          day: 'Day 1 - Full Body',
          focus: 'Push & Core',
          isRestDay: false,
          exercises: [
            { name: 'Push-ups', sets: 3, reps: '8-12', rest: '90 sec' },
            { name: 'Bodyweight Squats', sets: 3, reps: '15-20', rest: '90 sec' },
            { name: 'Plank Hold', sets: 3, reps: '30-45 sec', rest: '60 sec' },
            { name: 'Lunges', sets: 3, reps: '10 each', rest: '90 sec' },
            { name: 'Superman Hold', sets: 3, reps: '10-15', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 2 - Rest',
          focus: 'Recovery',
          isRestDay: true,
          exercises: [],
        },
        {
          day: 'Day 3 - Full Body',
          focus: 'Pull & Legs',
          isRestDay: false,
          exercises: [
            { name: 'Pike Push-ups', sets: 3, reps: '8-10', rest: '90 sec' },
            { name: 'Glute Bridges', sets: 3, reps: '15-20', rest: '60 sec' },
            { name: 'Inverted Rows (table)', sets: 3, reps: '8-12', rest: '90 sec' },
            { name: 'Step-ups', sets: 3, reps: '12 each', rest: '90 sec' },
            { name: 'Dead Bugs', sets: 3, reps: '10 each', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 4 - Rest',
          focus: 'Recovery',
          isRestDay: true,
          exercises: [],
        },
        {
          day: 'Day 5 - Full Body',
          focus: 'Mixed',
          isRestDay: false,
          exercises: [
            { name: 'Diamond Push-ups', sets: 3, reps: '6-10', rest: '90 sec' },
            { name: 'Bulgarian Split Squats', sets: 3, reps: '8 each', rest: '90 sec' },
            { name: 'Doorframe Rows', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Wall Sit', sets: 3, reps: '30-45 sec', rest: '60 sec' },
            { name: 'Mountain Climbers', sets: 3, reps: '20 total', rest: '60 sec' },
          ],
        },
      ],
      tips: [
        'Focus on slow, controlled movements',
        'Progress by adding reps before sets',
        'Use a backpack with books for added resistance',
        'Stretch for 10 minutes after each workout',
      ],
    },
    intermediate: {
      name: 'Calisthenics Builder',
      description: 'A 4-day progressive calisthenics program for building real-world strength and muscle.',
      daysPerWeek: 4,
      split: [
        {
          day: 'Day 1 - Upper Push',
          focus: 'Chest, Shoulders, Triceps',
          isRestDay: false,
          exercises: [
            { name: 'Decline Push-ups', sets: 4, reps: '12-15', rest: '90 sec' },
            { name: 'Pike Push-ups', sets: 4, reps: '8-12', rest: '90 sec' },
            { name: 'Diamond Push-ups', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Tricep Dips (chair)', sets: 3, reps: '12-15', rest: '60 sec' },
            { name: 'Pseudo Planche Leans', sets: 3, reps: '15-20 sec', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 2 - Lower Body',
          focus: 'Quads, Hamstrings, Glutes',
          isRestDay: false,
          exercises: [
            { name: 'Pistol Squat Progressions', sets: 4, reps: '5-8 each', rest: '2 min' },
            { name: 'Nordic Curl Negatives', sets: 3, reps: '5-8', rest: '2 min' },
            { name: 'Single Leg Glute Bridges', sets: 4, reps: '10 each', rest: '90 sec' },
            { name: 'Jump Squats', sets: 3, reps: '12-15', rest: '90 sec' },
            { name: 'Calf Raises (single leg)', sets: 4, reps: '15 each', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 3 - Rest',
          focus: 'Recovery',
          isRestDay: true,
          exercises: [],
        },
        {
          day: 'Day 4 - Upper Pull',
          focus: 'Back, Biceps',
          isRestDay: false,
          exercises: [
            { name: 'Pull-ups/Negatives', sets: 4, reps: '5-10', rest: '2 min' },
            { name: 'Inverted Rows', sets: 4, reps: '10-12', rest: '90 sec' },
            { name: 'Chin-ups/Negatives', sets: 3, reps: '5-8', rest: '2 min' },
            { name: 'Towel Rows', sets: 3, reps: '10-12', rest: '90 sec' },
            { name: 'Face Pulls (band)', sets: 3, reps: '15-20', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 5 - Full Body Power',
          focus: 'Explosive Movements',
          isRestDay: false,
          exercises: [
            { name: 'Clap Push-ups', sets: 3, reps: '6-10', rest: '2 min' },
            { name: 'Box Jumps', sets: 4, reps: '8-10', rest: '90 sec' },
            { name: 'Burpees', sets: 3, reps: '10-12', rest: '2 min' },
            { name: 'L-Sit Holds', sets: 3, reps: '15-20 sec', rest: '90 sec' },
            { name: 'Dragon Flag Negatives', sets: 3, reps: '5-8', rest: '2 min' },
          ],
        },
      ],
      tips: [
        'Invest in a pull-up bar and resistance bands',
        'Video yourself to check form on complex movements',
        'Progress to harder variations when reps become easy',
        'Add weighted vest when bodyweight becomes too light',
      ],
    },
    advanced: {
      name: 'Elite Calisthenics',
      description: 'A 5-day high-volume program for advanced athletes pursuing skills and maximal hypertrophy.',
      daysPerWeek: 5,
      split: [
        {
          day: 'Day 1 - Push Strength',
          focus: 'Heavy Push Movements',
          isRestDay: false,
          exercises: [
            { name: 'Handstand Push-ups', sets: 5, reps: '5-8', rest: '2-3 min' },
            { name: 'Archer Push-ups', sets: 4, reps: '6-8 each', rest: '2 min' },
            { name: 'Weighted Dips', sets: 4, reps: '8-10', rest: '2 min' },
            { name: 'Planche Leans', sets: 4, reps: '15-20 sec', rest: '2 min' },
            { name: 'Ring Push-ups', sets: 3, reps: '12-15', rest: '90 sec' },
          ],
        },
        {
          day: 'Day 2 - Pull Strength',
          focus: 'Heavy Pull Movements',
          isRestDay: false,
          exercises: [
            { name: 'Weighted Pull-ups', sets: 5, reps: '5-8', rest: '2-3 min' },
            { name: 'Archer Pull-ups', sets: 4, reps: '4-6 each', rest: '2 min' },
            { name: 'Front Lever Progressions', sets: 4, reps: '10-15 sec', rest: '2 min' },
            { name: 'Muscle-up Negatives', sets: 4, reps: '3-5', rest: '2 min' },
            { name: 'Ring Rows', sets: 3, reps: '12-15', rest: '90 sec' },
          ],
        },
        {
          day: 'Day 3 - Legs',
          focus: 'Advanced Lower Body',
          isRestDay: false,
          exercises: [
            { name: 'Pistol Squats', sets: 4, reps: '8-10 each', rest: '2 min' },
            { name: 'Nordic Curls', sets: 4, reps: '6-10', rest: '2 min' },
            { name: 'Shrimp Squats', sets: 3, reps: '6-8 each', rest: '2 min' },
            { name: 'Single Leg RDL', sets: 3, reps: '10 each', rest: '90 sec' },
            { name: 'Explosive Calf Raises', sets: 4, reps: '15-20', rest: '60 sec' },
          ],
        },
        {
          day: 'Day 4 - Skills & Core',
          focus: 'Skill Work',
          isRestDay: false,
          exercises: [
            { name: 'Freestanding Handstand', sets: 5, reps: '20-30 sec', rest: '2 min' },
            { name: 'L-Sit to V-Sit', sets: 4, reps: '5-8', rest: '2 min' },
            { name: 'Back Lever Progressions', sets: 4, reps: '10-15 sec', rest: '2 min' },
            { name: 'Dragon Flags', sets: 4, reps: '6-10', rest: '2 min' },
            { name: 'Hollow Body Rocks', sets: 3, reps: '20-30', rest: '90 sec' },
          ],
        },
        {
          day: 'Day 5 - Full Body Volume',
          focus: 'High Volume Finisher',
          isRestDay: false,
          exercises: [
            { name: 'Muscle-ups', sets: 4, reps: '3-5', rest: '2-3 min' },
            { name: 'Ring Dips', sets: 4, reps: '8-12', rest: '2 min' },
            { name: 'Bulgarian Split Squats', sets: 4, reps: '12 each', rest: '90 sec' },
            { name: 'Typewriter Pull-ups', sets: 3, reps: '4-6 each', rest: '2 min' },
            { name: 'Ab Wheel Rollouts', sets: 4, reps: '10-15', rest: '90 sec' },
          ],
        },
      ],
      tips: [
        'Film your skill work to track progress',
        'Prioritize mobility work for advanced movements',
        'Consider gymnastics rings for optimal progression',
        'Join a calisthenics community for motivation and tips',
      ],
    },
  };

  return plans[level];
}
