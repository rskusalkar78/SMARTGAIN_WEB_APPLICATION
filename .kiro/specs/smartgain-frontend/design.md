# Design Document: SmartGain Frontend

## Overview

The SmartGain Frontend is a modern, performant React application built with TypeScript that provides users with an intuitive interface for weight gain planning and progress tracking. The application follows a component-based architecture with clear separation of concerns between presentation, business logic, and data management layers.

### Key Design Principles

1. **Component Composition**: Build complex UIs from small, reusable components
2. **Type Safety**: Leverage TypeScript for compile-time error detection
3. **Performance First**: Implement code splitting, lazy loading, and optimistic updates
4. **Accessibility**: Ensure WCAG 2.1 AA compliance throughout
5. **Mobile-First**: Design for mobile devices first, then scale up
6. **Error Resilience**: Handle errors gracefully with clear user feedback

### Technology Stack

- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Routing**: React Router v6
- **State Management**: React Query v5 for server state, React Context for UI state
- **Styling**: Tailwind CSS with custom design system
- **Animation**: Framer Motion
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Validation**: Zod
- **Form Management**: React Hook Form

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Layouts │  │  Hooks   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Services │  │Validators│  │  Utils   │  │ Formatters│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Management Layer                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │React Query│ │API Client│  │Auth Store│  │  Cache   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────────────┐
                    │  Backend API  │
                    └───────────────┘
```

### Directory Structure

```
src/
├── api/                    # API client and endpoint definitions
│   ├── client.ts          # Axios instance with interceptors
│   ├── endpoints/         # API endpoint functions
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── nutrition.ts
│   │   ├── workout.ts
│   │   └── progress.ts
│   └── types.ts           # API request/response types
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (buttons, inputs, etc.)
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   ├── layout/           # Layout components (header, sidebar, etc.)
│   └── features/         # Feature-specific components
├── pages/                # Page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Progress.tsx
│   ├── MealPlan.tsx
│   ├── WorkoutPlan.tsx
│   └── Profile.tsx
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useForm.ts
├── contexts/             # React contexts
│   └── AuthContext.tsx
├── services/             # Business logic services
│   ├── authService.ts
│   ├── storageService.ts
│   └── calculationService.ts
├── utils/                # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── types/                # TypeScript type definitions
│   ├── user.ts
│   ├── nutrition.ts
│   └── workout.ts
├── styles/               # Global styles
│   └── globals.css
└── App.tsx               # Root component
```

## Components and Interfaces

### Core Components

#### 1. API Client (`api/client.ts`)

**Purpose**: Centralized HTTP client with authentication, error handling, and retry logic.

**Interface**:
```typescript
interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}

interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}
```

**Key Features**:
- Automatic JWT token injection from auth context
- Request/response interceptors for error handling
- Retry logic with exponential backoff (3 attempts)
- Request cancellation on component unmount
- Type-safe request/response handling

#### 2. Auth Context (`contexts/AuthContext.tsx`)

**Purpose**: Manage authentication state and provide auth methods throughout the app.

**Interface**:
```typescript
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

interface User {
  id: string
  email: string
  name: string
  profilePicture?: string
  goals: UserGoals
}
```

**Implementation Details**:
- Store JWT in memory and refresh token in httpOnly cookie
- Automatic token refresh on 401 responses
- Persist auth state across page refreshes using token validation
- Clear all state on logout

#### 3. Protected Route Component (`components/ProtectedRoute.tsx`)

**Purpose**: Guard routes that require authentication.

**Interface**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}
```

**Behavior**:
- Check authentication status before rendering
- Redirect to login if unauthenticated
- Store intended destination for post-login redirect
- Show loading state during auth verification

#### 4. Dashboard Page (`pages/Dashboard.tsx`)

**Purpose**: Main user interface displaying personalized data and quick actions.

**Components**:
- `DashboardHeader`: Welcome message and current date
- `StatsOverview`: Current weight, target weight, daily calorie goal
- `TodaySummary`: Today's logged meals, workouts, calories
- `QuickActions`: Buttons for logging meals, workouts, measurements
- `WeeklyProgress`: Line chart showing weight trend
- `UpcomingWorkouts`: Next scheduled workouts

**Data Requirements**:
- User profile data
- Today's nutrition logs
- Today's workout logs
- Weekly weight measurements
- Current meal and workout plans

#### 5. Progress Tracker (`pages/Progress.tsx`)

**Purpose**: Visualize user progress over time with interactive charts.

**Components**:
- `TimeRangeSelector`: Filter for 7d, 30d, 90d, all time
- `WeightChart`: Line chart of weight over time
- `CalorieChart`: Bar chart of daily calories vs target
- `WorkoutChart`: Workout completion rate
- `MeasurementsTable`: Table of body measurements

**Chart Configuration**:
- Use Recharts for all visualizations
- Responsive sizing based on container
- Interactive tooltips with detailed data
- Color-coded indicators for goal progress
- Empty states for insufficient data

#### 6. Meal Logger (`components/features/MealLogger.tsx`)

**Purpose**: Form for logging meals with calorie and macro tracking.

**Interface**:
```typescript
interface MealLogData {
  name: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fats: number
  notes?: string
  timestamp: Date
}
```

**Validation Rules**:
- Name: required, 1-100 characters
- Calories: required, positive number
- Macros: required, positive numbers
- Macro sum should approximately equal calories (allow 10% variance)

**Features**:
- Real-time calorie total calculation
- Running daily total display
- Success toast on submission
- Form reset after successful submission
- Optimistic UI updates

#### 7. Workout Logger (`components/features/WorkoutLogger.tsx`)

**Purpose**: Form for logging workout sessions.

**Interface**:
```typescript
interface WorkoutLogData {
  workoutType: string
  duration: number // minutes
  intensity: 'low' | 'moderate' | 'high'
  exercises?: string
  notes?: string
  timestamp: Date
}
```

**Validation Rules**:
- Workout type: required, from predefined list
- Duration: required, positive number, max 300 minutes
- Intensity: required, one of three levels

**Features**:
- Workout type dropdown with search
- Duration input with increment/decrement buttons
- Optional exercise details textarea
- Weekly workout history display

#### 8. Calculator Component (`components/features/Calculator.tsx`)

**Purpose**: Multi-step form for calculating calorie and macro recommendations.

**Steps**:
1. **Basic Info**: Age, gender, height, current weight, target weight
2. **Activity Level**: Sedentary, lightly active, moderately active, very active, extremely active
3. **Goals**: Weight gain rate, timeline, dietary preferences

**Interface**:
```typescript
interface CalculatorData {
  age: number
  gender: 'male' | 'female'
  height: number // cm
  currentWeight: number // kg
  targetWeight: number // kg
  activityLevel: ActivityLevel
  weeklyGainGoal: number // kg per week
  dietaryPreferences?: string[]
}

interface CalculatorResults {
  dailyCalories: number
  protein: number // grams
  carbs: number // grams
  fats: number // grams
  estimatedTimeToGoal: number // weeks
}
```

**Integration**:
- Replace local calculation with API call to `/api/v1/nutrition/calculate`
- Save results to user profile if authenticated
- Display results with visual breakdown
- Provide option to generate meal plan from results

#### 9. Form Components

**Base Input Component** (`components/ui/Input.tsx`):
```typescript
interface InputProps {
  label: string
  type: string
  value: string | number
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}
```

**Select Component** (`components/ui/Select.tsx`):
```typescript
interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  error?: string
  required?: boolean
  disabled?: boolean
}
```

**Features**:
- Accessible with proper ARIA labels
- Error state styling
- Focus management
- Keyboard navigation support

#### 10. Error Boundary (`components/ErrorBoundary.tsx`)

**Purpose**: Catch and handle React component errors gracefully.

**Interface**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}
```

**Behavior**:
- Catch errors in child component tree
- Display user-friendly error message
- Provide retry button
- Log error details to console in development
- Offer navigation back to home page

## Data Models

### User Model

```typescript
interface User {
  id: string
  email: string
  name: string
  profilePicture?: string
  goals: UserGoals
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

interface UserGoals {
  currentWeight: number
  targetWeight: number
  weeklyGainGoal: number
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFats: number
}

interface UserPreferences {
  activityLevel: ActivityLevel
  dietaryRestrictions: string[]
  measurementUnit: 'metric' | 'imperial'
}

type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
```

### Nutrition Models

```typescript
interface MealLog {
  id: string
  userId: string
  name: string
  mealType: MealType
  calories: number
  protein: number
  carbs: number
  fats: number
  notes?: string
  timestamp: Date
  createdAt: Date
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface MealPlan {
  id: string
  userId: string
  startDate: Date
  endDate: Date
  meals: DailyMeals[]
  createdAt: Date
}

interface DailyMeals {
  date: Date
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  snacks: Meal[]
}

interface Meal {
  name: string
  ingredients: string[]
  instructions: string
  calories: number
  protein: number
  carbs: number
  fats: number
}
```

### Workout Models

```typescript
interface WorkoutLog {
  id: string
  userId: string
  workoutType: string
  duration: number
  intensity: Intensity
  exercises?: string
  notes?: string
  timestamp: Date
  createdAt: Date
}

type Intensity = 'low' | 'moderate' | 'high'

interface WorkoutPlan {
  id: string
  userId: string
  startDate: Date
  endDate: Date
  workouts: DailyWorkout[]
  createdAt: Date
}

interface DailyWorkout {
  date: Date
  muscleGroup: string
  exercises: Exercise[]
  estimatedDuration: number
}

interface Exercise {
  name: string
  sets: number
  reps: number
  restPeriod: number // seconds
  instructions: string
  videoUrl?: string
}
```

### Progress Models

```typescript
interface WeightLog {
  id: string
  userId: string
  weight: number
  bodyFat?: number
  measurements?: BodyMeasurements
  timestamp: Date
  createdAt: Date
}

interface BodyMeasurements {
  chest?: number
  waist?: number
  hips?: number
  leftArm?: number
  rightArm?: number
  leftThigh?: number
  rightThigh?: number
}

interface DashboardData {
  user: User
  todayStats: TodayStats
  weeklyProgress: WeightLog[]
  upcomingWorkouts: DailyWorkout[]
}

interface TodayStats {
  caloriesConsumed: number
  caloriesTarget: number
  proteinConsumed: number
  proteinTarget: number
  mealsLogged: number
  workoutsCompleted: number
}
```

## State Management Strategy

### React Query Configuration

**Query Keys Structure**:
```typescript
const queryKeys = {
  auth: ['auth'] as const,
  user: ['user'] as const,
  dashboard: ['dashboard'] as const,
  mealLogs: (date?: string) => ['mealLogs', date] as const,
  workoutLogs: (date?: string) => ['workoutLogs', date] as const,
  weightLogs: (range?: string) => ['weightLogs', range] as const,
  mealPlan: ['mealPlan'] as const,
  workoutPlan: ['workoutPlan'] as const,
}
```

**Cache Configuration**:
- Dashboard data: stale time 5 minutes, cache time 10 minutes
- User profile: stale time 10 minutes, cache time 30 minutes
- Logs: stale time 1 minute, cache time 5 minutes
- Plans: stale time 30 minutes, cache time 1 hour

**Mutation Patterns**:
```typescript
// Optimistic update example for meal logging
const logMealMutation = useMutation({
  mutationFn: (data: MealLogData) => api.post('/nutrition/logs', data),
  onMutate: async (newMeal) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.mealLogs() })
    
    // Snapshot previous value
    const previousMeals = queryClient.getQueryData(queryKeys.mealLogs())
    
    // Optimistically update
    queryClient.setQueryData(queryKeys.mealLogs(), (old) => [...old, newMeal])
    
    return { previousMeals }
  },
  onError: (err, newMeal, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.mealLogs(), context.previousMeals)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: queryKeys.mealLogs() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() })
  },
})
```

### Local UI State

Use React Context for:
- Theme preferences (light/dark mode)
- Sidebar open/closed state
- Modal visibility
- Toast notifications

Use component state for:
- Form inputs
- Dropdown open/closed
- Hover states
- Animation states

## API Integration Patterns

### Endpoint Organization

```typescript
// api/endpoints/auth.ts
export const authApi = {
  login: (credentials: LoginCredentials) => 
    client.post<AuthResponse>('/auth/login', credentials),
  
  register: (data: RegisterData) => 
    client.post<AuthResponse>('/auth/register', data),
  
  refreshToken: () => 
    client.post<AuthResponse>('/auth/refresh'),
  
  logout: () => 
    client.post('/auth/logout'),
}

// api/endpoints/nutrition.ts
export const nutritionApi = {
  calculate: (data: CalculatorData) => 
    client.post<CalculatorResults>('/nutrition/calculate', data),
  
  logMeal: (data: MealLogData) => 
    client.post<MealLog>('/nutrition/logs', data),
  
  getMealLogs: (date?: string) => 
    client.get<MealLog[]>('/nutrition/logs', { params: { date } }),
  
  getMealPlan: () => 
    client.get<MealPlan>('/nutrition/meal-plan'),
}

// api/endpoints/workout.ts
export const workoutApi = {
  logWorkout: (data: WorkoutLogData) => 
    client.post<WorkoutLog>('/workout/logs', data),
  
  getWorkoutLogs: (date?: string) => 
    client.get<WorkoutLog[]>('/workout/logs', { params: { date } }),
  
  getWorkoutPlan: () => 
    client.get<WorkoutPlan>('/workout/plan'),
}

// api/endpoints/progress.ts
export const progressApi = {
  logWeight: (data: WeightLogData) => 
    client.post<WeightLog>('/progress/weight', data),
  
  getWeightLogs: (range?: string) => 
    client.get<WeightLog[]>('/progress/weight', { params: { range } }),
}

// api/endpoints/dashboard.ts
export const dashboardApi = {
  getDashboard: () => 
    client.get<DashboardData>('/dashboard'),
}
```

### Error Handling Strategy

**Error Types**:
1. **Network Errors**: No internet connection or server unreachable
2. **Authentication Errors**: 401 Unauthorized, token expired
3. **Validation Errors**: 400 Bad Request with field-level errors
4. **Server Errors**: 500 Internal Server Error
5. **Not Found Errors**: 404 Resource not found

**Error Response Format**:
```typescript
interface ApiErrorResponse {
  message: string
  statusCode: number
  errors?: Record<string, string[]> // Field-level validation errors
}
```

**Error Handling Flow**:
```typescript
// In API client interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await authService.refreshToken()
        // Retry original request
        return axios.request(error.config)
      } catch {
        // Refresh failed, logout user
        authService.logout()
        window.location.href = '/login'
      }
    }
    
    if (!error.response) {
      // Network error
      throw new ApiError('Network error. Please check your connection.', 0)
    }
    
    // Parse error response
    const apiError: ApiErrorResponse = error.response.data
    throw new ApiError(apiError.message, apiError.statusCode, apiError.errors)
  }
)
```

### Retry Logic

```typescript
const retryConfig = {
  retries: 3,
  retryDelay: (retryCount: number) => {
    return Math.min(1000 * 2 ** retryCount, 10000) // Exponential backoff, max 10s
  },
  retryCondition: (error: AxiosError) => {
    // Retry on network errors and 5xx server errors
    return !error.response || error.response.status >= 500
  },
}
```

## Routing Structure

```typescript
const routes = [
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/calculator',
    element: <Calculator />,
  },
  {
    path: '/app',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'progress',
        element: <Progress />,
      },
      {
        path: 'nutrition',
        children: [
          {
            path: 'log',
            element: <MealLogger />,
          },
          {
            path: 'plan',
            element: <MealPlan />,
          },
        ],
      },
      {
        path: 'workout',
        children: [
          {
            path: 'log',
            element: <WorkoutLogger />,
          },
          {
            path: 'plan',
            element: <WorkoutPlan />,
          },
        ],
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
]
```

**Route Guards**:
- Public routes: `/`, `/login`, `/register`, `/calculator`
- Protected routes: Everything under `/app/*`
- Redirect authenticated users away from login/register
- Redirect unauthenticated users to login from protected routes


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Validation Properties**: Multiple requirements (6.2, 7.2, 8.2, 13.3, 13.4, 13.5) test validation of different input types. These can be consolidated into comprehensive validation properties that cover all input types rather than separate properties for each field type.

**Form Submission Properties**: Requirements 6.3, 7.3, 8.3 all test similar submission flows. These can be consolidated into a single property about form submission behavior.

**Error Handling Properties**: Requirements 6.5, 7.5, 8.5, 20.5 all test similar error preservation behavior. These can be consolidated into a single property about error handling.

**Calculator Step Validation**: Requirements 9.2 and 9.3 test the same behavior for different steps. These can be consolidated into a single property about step validation.

**Protected Route Properties**: Requirements 3.1 and 3.3 both test authentication checking for protected routes. These can be consolidated into a single comprehensive property.

**State Management Properties**: Requirements 12.2, 12.3, 12.4, 12.7 all test different aspects of state management that can be verified together in comprehensive properties.

### API Client Properties

**Property 1: Authenticated requests include JWT token**

*For any* API request made while the user is authenticated, the request should include the JWT token in the Authorization header.

**Validates: Requirements 1.2**

**Property 2: Network errors trigger retry with exponential backoff**

*For any* API request that fails with a network error, the client should retry up to 3 times with exponentially increasing delays between attempts.

**Validates: Requirements 1.4**

**Property 3: Validation errors are parsed correctly**

*For any* API response containing validation errors, the client should parse the error structure and format it into a field-level error map.

**Validates: Requirements 1.6**

**Property 4: Request cancellation on unmount**

*For any* pending API request, if the component that initiated it unmounts, the request should be cancelled.

**Validates: Requirements 1.7**

### Authentication Properties

**Property 5: Successful authentication stores tokens**

*For any* successful authentication (login or register), the auth manager should store the JWT token in memory and the refresh token in an httpOnly cookie.

**Validates: Requirements 2.3**

**Property 6: Email and password validation**

*For any* email input, the validation should reject invalid email formats, and for any password input, the validation should reject passwords that don't meet minimum strength requirements (8+ characters, uppercase, lowercase, number).

**Validates: Requirements 2.6, 13.3, 13.4**

### Route Protection Properties

**Property 7: Protected routes require authentication**

*For any* protected route, when accessed by an unauthenticated user, the route guard should redirect to the login page and store the intended destination.

**Validates: Requirements 3.1, 3.3**

**Property 8: Public routes are always accessible**

*For any* public route, the route should be accessible regardless of authentication status.

**Validates: Requirements 3.5**

### Progress Tracking Properties

**Property 9: Time range filter updates data**

*For any* time range selection in the progress tracker, all displayed data should be filtered to only include entries within the selected time period.

**Validates: Requirements 5.4**

### Data Logging Properties

**Property 10: Numeric validation for meal logs**

*For any* meal log submission, all numeric fields (calories, protein, carbs, fats) should be validated as positive numbers, and any negative or non-numeric value should be rejected.

**Validates: Requirements 6.2**

**Property 11: Daily calorie total accuracy**

*For any* set of meal logs for a given day, the displayed daily calorie total should equal the sum of calories from all logged meals.

**Validates: Requirements 6.8**

**Property 12: Workout duration validation**

*For any* workout log submission, the duration field should be validated as a positive number, and any negative or non-numeric value should be rejected.

**Validates: Requirements 7.2**

**Property 13: Weight range validation**

*For any* weight measurement submission, the weight should be validated to be within a reasonable range (30-300 kg), and any value outside this range should be rejected.

**Validates: Requirements 8.2**

**Property 14: Form data preservation on error**

*For any* form submission that fails, the form should preserve all user-entered data so it can be corrected and resubmitted without re-entering everything.

**Validates: Requirements 6.5, 7.5, 8.5, 20.5**

### Calculator Properties

**Property 15: Step validation prevents progression**

*For any* calculator step, if the current step contains invalid data, the user should not be able to proceed to the next step.

**Validates: Requirements 9.2, 9.3**

**Property 16: Authenticated calculator saves results**

*For any* calculator completion by an authenticated user, the results should be automatically saved to the user's profile.

**Validates: Requirements 9.8**

### State Management Properties

**Property 17: API responses are cached**

*For any* successful API response, the data should be cached by React Query with the appropriate stale time for that data type.

**Validates: Requirements 12.2**

**Property 18: Mutations invalidate related queries**

*For any* data mutation (create, update, delete), all related queries should be invalidated to trigger a refetch of updated data.

**Validates: Requirements 12.3**

**Property 19: Optimistic updates occur before API response**

*For any* user action that modifies data (logging meals, workouts, etc.), the UI should update optimistically before the API response is received.

**Validates: Requirements 12.4**

**Property 20: Authentication persists across refreshes**

*For any* authenticated session, if the page is refreshed, the authentication state should be restored from the stored token.

**Validates: Requirements 12.6**

**Property 21: Queries provide loading and error states**

*For any* React Query query, it should provide both loading and error states that can be used to display appropriate UI feedback.

**Validates: Requirements 12.7**

### Validation Properties

**Property 22: Positive number validation**

*For any* numeric input field that should only accept positive values (calories, macros, duration, weight), the validation should reject zero, negative numbers, and non-numeric values.

**Validates: Requirements 13.5**

### Error Handling Properties

**Property 23: Error boundary catches component errors**

*For any* error thrown in a React component tree, the error boundary should catch it and prevent the entire application from crashing.

**Validates: Requirements 14.1**

**Property 24: Error type classification**

*For any* API error, the application should correctly classify it as a network error, validation error, authentication error, or server error based on the response status and structure.

**Validates: Requirements 14.5**

### Performance Properties

**Property 25: Search input debouncing**

*For any* search input field, rapid consecutive changes should be debounced such that API calls are only made after the user stops typing for at least 300ms.

**Validates: Requirements 16.6**

### Accessibility Properties

**Property 26: Keyboard navigation support**

*For any* interactive element (buttons, links, form inputs), it should be accessible via keyboard navigation using Tab, Enter, and arrow keys.

**Validates: Requirements 17.2**

**Property 27: ARIA labels for non-text elements**

*For any* icon, image, or non-text interactive element, it should have an appropriate ARIA label or aria-labelledby attribute for screen reader support.

**Validates: Requirements 17.4**

**Property 28: Focus indicators present**

*For any* interactive element, when it receives keyboard focus, it should display a visible focus indicator.

**Validates: Requirements 17.6**

### Animation Properties

**Property 29: Reduced motion preference respected**

*For any* animation in the application, if the user has enabled the "prefers-reduced-motion" setting, the animation should be disabled or significantly reduced.

**Validates: Requirements 18.4**

### Offline Support Properties

**Property 30: Cached data displayed when offline**

*For any* data that has been previously fetched and cached, if the user goes offline, the cached data should still be displayed.

**Validates: Requirements 19.1**

**Property 31: Offline requests are queued**

*For any* data submission attempt while offline, the request should be queued for automatic retry when the connection is restored.

**Validates: Requirements 19.3**

**Property 32: Queued requests retry on reconnection**

*For any* queued request from offline mode, when the connection is restored, the request should be automatically retried.

**Validates: Requirements 19.4**

**Property 33: Features disabled when offline**

*For any* feature that requires real-time data or server interaction, it should be disabled or show an appropriate message when the user is offline.

**Validates: Requirements 19.6**

### Profile Management Properties

**Property 34: Profile updates are validated**

*For any* profile update submission, all fields should be validated according to their rules (email format, password strength, etc.) before the request is sent to the backend.

**Validates: Requirements 20.3**

## Error Handling

### Error Categories

1. **Network Errors**: Connection failures, timeouts, DNS errors
2. **Authentication Errors**: Invalid credentials, expired tokens, unauthorized access
3. **Validation Errors**: Invalid input data, failed business rules
4. **Server Errors**: 500-level responses, unexpected backend failures
5. **Client Errors**: Component crashes, state corruption, unexpected conditions

### Error Handling Strategy

**Network Errors**:
- Display: "Unable to connect. Please check your internet connection."
- Action: Provide retry button, show cached data if available
- Logging: Log to console in development mode

**Authentication Errors**:
- Display: "Your session has expired. Please log in again."
- Action: Clear auth state, redirect to login, preserve intended destination
- Logging: Log token expiration events

**Validation Errors**:
- Display: Field-level error messages below each invalid field
- Action: Highlight invalid fields, disable submit until valid
- Logging: Log validation failures in development mode

**Server Errors**:
- Display: "Something went wrong on our end. Please try again."
- Action: Provide retry button, log error details
- Logging: Log full error response and stack trace

**Client Errors**:
- Display: "An unexpected error occurred. Please refresh the page."
- Action: Error boundary catches error, provides reset button
- Logging: Log component stack trace and error details

### Error Recovery Mechanisms

1. **Automatic Retry**: Network errors retry 3 times with exponential backoff
2. **Token Refresh**: 401 errors trigger automatic token refresh attempt
3. **Optimistic Rollback**: Failed mutations rollback optimistic updates
4. **Error Boundaries**: Component errors caught and isolated to prevent full app crash
5. **Offline Queue**: Failed requests queued when offline, retried on reconnection

### User Feedback

- **Toast Notifications**: Non-critical errors (failed to load optional data)
- **Inline Messages**: Form validation errors, field-level feedback
- **Modal Dialogs**: Critical errors requiring user acknowledgment
- **Banner Messages**: Persistent issues (offline mode, maintenance)
- **Loading States**: Skeleton screens, spinners, progress indicators

## Testing Strategy

### Dual Testing Approach

The SmartGain Frontend will use both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific user flows (login, registration, form submission)
- Edge cases (empty data, boundary values, special characters)
- Error conditions (network failures, validation errors, server errors)
- Integration points between components
- Component rendering and interaction

**Property-Based Tests**: Verify universal properties across all inputs
- Input validation rules hold for all possible inputs
- State management behaves correctly for all data mutations
- Authentication and authorization work for all user states
- API client handles all error types correctly
- Accessibility features work for all interactive elements

### Testing Tools

- **Test Framework**: Vitest
- **React Testing**: React Testing Library
- **Property-Based Testing**: fast-check
- **API Mocking**: MSW (Mock Service Worker)
- **Accessibility Testing**: jest-axe, pa11y
- **E2E Testing**: Playwright (for critical user flows)

### Property-Based Test Configuration

Each property-based test will:
- Run a minimum of 100 iterations to ensure comprehensive input coverage
- Use fast-check generators to create random test data
- Include a comment tag referencing the design property
- Tag format: `// Feature: smartgain-frontend, Property N: [property description]`

### Test Organization

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── properties/
│   │   ├── api-client.properties.test.ts
│   │   ├── auth.properties.test.ts
│   │   ├── validation.properties.test.ts
│   │   ├── state-management.properties.test.ts
│   │   └── accessibility.properties.test.ts
│   └── integration/
│       ├── auth-flow.test.ts
│       ├── meal-logging.test.ts
│       └── calculator.test.ts
```

### Example Property Test

```typescript
// Feature: smartgain-frontend, Property 10: Numeric validation for meal logs
describe('Meal Log Validation Properties', () => {
  it('should reject negative or non-numeric values for all numeric fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          calories: fc.oneof(fc.integer({ max: -1 }), fc.constant(NaN)),
          protein: fc.oneof(fc.integer({ max: -1 }), fc.constant(NaN)),
          carbs: fc.oneof(fc.integer({ max: -1 }), fc.constant(NaN)),
          fats: fc.oneof(fc.integer({ max: -1 }), fc.constant(NaN)),
        }),
        (invalidMealLog) => {
          const result = validateMealLog(invalidMealLog)
          expect(result.isValid).toBe(false)
          expect(result.errors).toHaveProperty('calories')
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 34 correctness properties implemented
- **Integration Test Coverage**: All critical user flows covered
- **Accessibility Test Coverage**: All interactive components tested with jest-axe
- **E2E Test Coverage**: 5-10 critical paths (login → dashboard → log meal → view progress)

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every pull request
- Run integration tests on every pull request
- Run E2E tests before deployment
- Run accessibility audits weekly
- Monitor test execution time and optimize slow tests
