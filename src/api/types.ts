// SmartGain Frontend - API Type Definitions
// Comprehensive TypeScript interfaces for all API requests and responses

// ============================================================================
// Common Types
// ============================================================================

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very'
  | 'extreme';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Intensity = 'low' | 'moderate' | 'high';

export type MeasurementUnit = 'metric' | 'imperial';

// ============================================================================
// Error Types
// ============================================================================

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>; // Field-level validation errors
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  goals: UserGoals;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserGoals {
  currentWeight: number;
  targetWeight: number;
  weeklyGainGoal: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
}

export interface UserPreferences {
  activityLevel: ActivityLevel;
  dietaryRestrictions: string[];
  measurementUnit: MeasurementUnit;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  profilePicture?: string;
  goals?: Partial<UserGoals>;
  preferences?: Partial<UserPreferences>;
}

// ============================================================================
// Nutrition Types
// ============================================================================

export interface CalculatorData {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  activityLevel: ActivityLevel;
  weeklyGainGoal: number; // kg per week
  dietaryPreferences?: string[];
}

export interface CalculatorResults {
  dailyCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  estimatedTimeToGoal: number; // weeks
}

export interface MealLogData {
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
  timestamp: string;
}

export interface MealLog extends MealLogData {
  id: string;
  userId: string;
  createdAt: string;
}

export interface Meal {
  name: string;
  ingredients: string[];
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyMeals {
  date: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

export interface MealPlan {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  meals: DailyMeals[];
  createdAt: string;
}

// ============================================================================
// Workout Types
// ============================================================================

export interface WorkoutLogData {
  workoutType: string;
  duration: number; // minutes
  intensity: Intensity;
  exercises?: string;
  notes?: string;
  timestamp: string;
}

export interface WorkoutLog extends WorkoutLogData {
  id: string;
  userId: string;
  createdAt: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  restPeriod: number; // seconds
  instructions: string;
  videoUrl?: string;
}

export interface DailyWorkout {
  date: string;
  muscleGroup: string;
  exercises: Exercise[];
  estimatedDuration: number;
  isRestDay?: boolean;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  workouts: DailyWorkout[];
  createdAt: string;
}

// ============================================================================
// Progress Types
// ============================================================================

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
}

export interface WeightLogData {
  weight: number;
  bodyFat?: number;
  measurements?: BodyMeasurements;
  timestamp: string;
}

export interface WeightLog extends WeightLogData {
  id: string;
  userId: string;
  createdAt: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface TodayStats {
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  mealsLogged: number;
  workoutsCompleted: number;
}

export interface DashboardData {
  user: User;
  todayStats: TodayStats;
  weeklyProgress: WeightLog[];
  upcomingWorkouts: DailyWorkout[];
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  range?: '7d' | '30d' | '90d' | 'all';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
