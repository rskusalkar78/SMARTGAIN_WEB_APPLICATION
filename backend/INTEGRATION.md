# SmartGain Backend Service Integration

This document describes how all services are wired together in the SmartGain backend system.

## Integration Overview

The SmartGain backend follows a layered architecture with clear separation of concerns:

```
Routes → Controllers → Integration Services → Core Services → Models → Database
```

## Service Integration Modules

### 1. Calculation Integration (`services/integration/calculationIntegration.js`)

**Purpose**: Connects the calculation engine to user profile updates

**Key Functions**:
- `recalculateUserMetrics(user)`: Recalculates BMR, TDEE, target calories, and macros
- `requiresRecalculation(updates)`: Determines if profile changes need recalculation

**Integration Points**:
- **Auth Service**: Automatically recalculates metrics when user profile is updated
- **User Registration**: Calculates initial metrics during user registration
- **Profile Updates**: Triggers recalculation when relevant fields change (age, weight, height, activity level, goal intensity)

**Connected Services**:
- `bmrCalculator.js` - BMR calculations
- `tdeeCalculator.js` - TDEE and weight gain calorie calculations
- `macroCalculator.js` - Macro distribution calculations

### 2. Adaptive Integration (`services/integration/adaptiveIntegration.js`)

**Purpose**: Integrates adaptive intelligence with progress tracking

**Key Functions**:
- `performAdaptiveAnalysis(userId)`: Analyzes progress and applies adjustments
- `needsAdaptiveAnalysis(userId)`: Checks if weekly analysis is due

**Integration Points**:
- **Dashboard Controller**: Can trigger adaptive analysis on dashboard load
- **Progress Tracker**: Pulls weight trends, calorie metrics, and workout metrics
- **Adaptation Logs**: Records all adaptive adjustments for history

**Connected Services**:
- `adaptiveIntelligence.js` - Adaptation logic
- `progressTracker.js` - Progress metrics
- `AdaptationLog` model - Persistence

### 3. Nutrition Integration (`services/integration/nutritionIntegration.js`)

**Purpose**: Links nutrition intelligence with meal planning routes

**Key Functions**:
- `generateUserMealPlan(userId, options)`: Creates personalized meal plans
- `validateMealCompliance(foods, dietaryPreferences)`: Validates dietary restrictions
- `calculateMealNutrition(foods)`: Calculates nutritional totals

**Integration Points**:
- **Nutrition Controller**: Generates meal plans with user preferences
- **User Model**: Pulls dietary preferences and calorie targets
- **Calorie Logging**: Validates meal compliance

**Connected Services**:
- `macroCalculator.js` - Meal plan generation
- `nutritionDatabase.js` - Food nutritional data

### 4. Workout Integration (`services/integration/workoutIntegration.js`)

**Purpose**: Connects workout engine with progress data

**Key Functions**:
- `generateUserWorkoutPlan(userId, options)`: Creates personalized workout plans
- `applyProgressiveOverload(userId, workoutLogId)`: Applies progression
- `adjustWorkoutIntensity(userId, recoveryMetrics)`: Adjusts intensity based on recovery
- `calculateWorkoutVolume(workout)`: Calculates total volume

**Integration Points**:
- **Workout Controller**: Generates workout plans based on fitness level
- **Workout Logs**: Pulls recent workout history for progression
- **Progress Tracker**: Provides workout metrics for adaptive adjustments

**Connected Services**:
- `workoutEngine.js` - Workout plan generation
- `WorkoutLog` model - Workout history

## API Route Integration

### Authentication Routes (`/api/v1/auth`)

**Integrated Services**:
- Auth Service → Calculation Integration
- User registration triggers initial metric calculation
- Profile updates trigger metric recalculation

**Endpoints**:
- `POST /register` - Creates user + calculates initial metrics
- `PUT /profile` - Updates profile + recalculates if needed
- `POST /login` - Authenticates user
- `GET /profile` - Returns user with calculations

### Dashboard Routes (`/api/v1/dashboard`)

**Integrated Services**:
- Progress Tracker → Adaptive Integration
- Pulls weight trends, calorie metrics, milestones, concerns

**Endpoints**:
- `GET /summary` - Complete dashboard with all metrics

### Nutrition Routes (`/api/v1/nutrition`)

**Integrated Services**:
- Nutrition Integration → Macro Calculator → Nutrition Database
- User preferences → Meal plan generation

**Endpoints**:
- `GET /meal-plan` - Personalized meal plan with dietary preferences
- `POST /log` - Log daily calorie intake

### Workout Routes (`/api/v1/workout`)

**Integrated Services**:
- Workout Integration → Workout Engine
- Fitness level + workout history → Workout plan

**Endpoints**:
- `GET /current-plan` - Personalized workout plan
- `POST /log` - Log workout session with volume calculation

### Progress Routes (`/api/v1/progress`)

**Integrated Services**:
- Progress Tracker → All data models
- Aggregates body stats, calorie logs, workout logs

**Endpoints**:
- `GET /analytics` - Comprehensive progress analytics

### Plans Routes (`/api/v1/plans`)

**Integrated Services**:
- Calculation Integration → User Model
- Applies calorie and macro adjustments

**Endpoints**:
- `PUT /update` - Update calorie and workout plans

### Stats Routes (`/api/v1/stats`)

**Integrated Services**:
- Direct model access for logging

**Endpoints**:
- `POST /body` - Log body stats (weight, measurements)

## Data Flow Examples

### Example 1: User Registration Flow

```
1. POST /api/v1/auth/register
2. AuthController.register()
3. AuthService.registerUser()
4. Create User model
5. recalculateUserMetrics() [Integration]
   - calculateBMR()
   - calculateTDEE()
   - calculateWeightGainCalories()
   - calculateMacroTargets()
6. Save user with calculations
7. Generate JWT token
8. Return user + token
```

### Example 2: Profile Update Flow

```
1. PUT /api/v1/auth/profile
2. AuthController.updateProfile()
3. AuthService.updateUserProfile()
4. requiresRecalculation() checks if recalc needed
5. If yes: recalculateUserMetrics() [Integration]
6. Save updated user
7. Return updated user with new calculations
```

### Example 3: Meal Plan Generation Flow

```
1. GET /api/v1/nutrition/meal-plan
2. NutritionController.getMealPlan()
3. generateUserMealPlan() [Integration]
4. Fetch user with calculations and preferences
5. generateMealPlan() with user data
6. validateMealCompliance() for dietary restrictions
7. Return personalized meal plan
```

### Example 4: Workout Plan Generation Flow

```
1. GET /api/v1/workout/current-plan
2. WorkoutController.getCurrentPlan()
3. generateUserWorkoutPlan() [Integration]
4. Fetch user fitness level
5. Fetch recent workout logs for progression
6. generateWeeklyPlan() with user data
7. Return personalized workout plan
```

### Example 5: Dashboard Summary Flow

```
1. GET /api/v1/dashboard/summary
2. DashboardController.getSummary()
3. Fetch user data
4. calculateWeightTrend() [Progress Tracker]
5. calculateCalorieMetrics() [Progress Tracker]
6. detectMilestones() [Progress Tracker]
7. detectConcerningPatterns() [Progress Tracker]
8. Return comprehensive dashboard summary
```

### Example 6: Adaptive Analysis Flow

```
1. Triggered weekly or on-demand
2. performAdaptiveAnalysis() [Integration]
3. calculateWeightTrend() [Progress Tracker]
4. calculateCalorieMetrics() [Progress Tracker]
5. getWorkoutMetrics() [Progress Tracker]
6. analyzeProgressAndAdapt() [Adaptive Intelligence]
7. Create AdaptationLog entries
8. Return adaptation recommendations
```

## Middleware Integration

### Authentication Middleware

**File**: `middleware/auth.js`

**Integration**:
- Validates JWT tokens on all protected routes
- Attaches `userId` to request object
- Used by all controllers except auth registration/login

### Error Handler Middleware

**File**: `middleware/errorHandler.js`

**Integration**:
- Global error handler for all routes
- Formats error responses consistently
- Logs errors with Winston

### Validation Middleware

**File**: `utils/validation.js`

**Integration**:
- Validates request bodies using Joi schemas
- Used on auth routes for registration, login, profile updates
- Prevents invalid data from reaching services

## Database Integration

### Models

All models are connected through Mongoose ODM:

- **User**: Core user data with calculations
- **BodyStats**: Weight and measurement history
- **CalorieLog**: Daily calorie intake logs
- **WorkoutLog**: Workout session logs
- **AdaptationLog**: Adaptive adjustment history

### Model Methods

Models include static and instance methods for common operations:

- `User.findByEmail(email)` - Find user by email
- `BodyStats.getStatsInRange(userId, startDate, endDate)` - Get stats in date range
- `CalorieLog.getCalorieStreak(userId)` - Calculate current streak
- `WorkoutLog.getWorkoutFrequency(userId, days)` - Calculate workout frequency
- `AdaptationLog.getAdaptationsInRange(userId, startDate, endDate)` - Get adaptations

## Testing Integration

### Integration Tests

**File**: `tests/integration/service-integration.test.js`

Tests the complete integration of:
- Calculation integration with user updates
- Nutrition integration with meal plan generation
- Workout integration with workout plan generation

### Unit Tests

Individual service tests verify:
- BMR calculation accuracy
- TDEE calculation
- Macro distribution
- Meal plan generation
- Workout plan generation
- Progress tracking calculations

## Configuration

### Environment Variables

All services use centralized configuration from `config/index.js`:

- Database connection strings
- JWT secrets
- Rate limiting settings
- CORS origins
- API version

### Logging

All integration points log key events:
- User metric recalculations
- Meal plan generations
- Workout plan generations
- Adaptive adjustments
- Errors and warnings

## Summary

The SmartGain backend achieves complete service integration through:

1. **Integration Service Layer**: Bridges controllers and core services
2. **Automatic Triggers**: Profile updates trigger recalculations
3. **Data Flow**: Clear data flow from routes through services to models
4. **Centralized Configuration**: Single source of truth for settings
5. **Comprehensive Logging**: All integration points are logged
6. **Error Handling**: Consistent error handling across all services

All services are now fully wired and ready for production use.
