# SmartGain Frontend - API Module

This module provides a robust, type-safe API client for communicating with the SmartGain backend.

## Features

- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- ✅ **Authentication**: Automatic JWT token injection in requests
- ✅ **Error Handling**: Intelligent error parsing and classification
- ✅ **Retry Logic**: Automatic retry with exponential backoff for network errors
- ✅ **Request Cancellation**: Support for cancelling pending requests
- ✅ **Development Logging**: Detailed logging in development mode

## Structure

```
src/api/
├── client.ts           # Axios instance with interceptors
├── types.ts            # TypeScript type definitions
├── axios.d.ts          # Axios type extensions
├── endpoints/          # API endpoint modules
│   ├── auth.ts        # Authentication endpoints
│   ├── nutrition.ts   # Nutrition endpoints
│   ├── workout.ts     # Workout endpoints
│   ├── progress.ts    # Progress tracking endpoints
│   ├── dashboard.ts   # Dashboard endpoints
│   └── index.ts       # Endpoint exports
└── index.ts           # Main module exports
```

## Usage

### Basic Usage

```typescript
import { authApi, nutritionApi } from '@/api';

// Login
const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});

// Calculate nutrition
const results = await nutritionApi.calculate({
  age: 25,
  gender: 'male',
  height: 180,
  currentWeight: 70,
  targetWeight: 80,
  activityLevel: 'moderately_active',
  weeklyGainGoal: 0.5
});
```

### Token Management

```typescript
import { setAccessToken, getAccessToken } from '@/api';

// Set token after login
setAccessToken(response.accessToken);

// Get current token
const token = getAccessToken();

// Clear token on logout
setAccessToken(null);
```

### Request Cancellation

```typescript
import { createCancelToken, isCancel } from '@/api';

const cancelToken = createCancelToken();

try {
  const data = await nutritionApi.getMealLogs(undefined, {
    cancelToken: cancelToken.token
  });
} catch (error) {
  if (isCancel(error)) {
    console.log('Request cancelled');
  }
}

// Cancel the request
cancelToken.cancel('User cancelled');
```

### Error Handling

```typescript
import { ApiError } from '@/api';

try {
  await authApi.login(credentials);
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.statusCode);
    console.log('Message:', error.message);
    
    // Field-level validation errors
    if (error.errors) {
      console.log('Validation errors:', error.errors);
    }
  }
}
```

## Configuration

Set the API base URL in your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## API Endpoints

### Authentication (`authApi`)

- `login(credentials)` - Login with email and password
- `register(data)` - Register a new user
- `refresh()` - Refresh access token
- `logout()` - Logout current user

### Nutrition (`nutritionApi`)

- `calculate(data)` - Calculate daily calories and macros
- `logMeal(data)` - Log a meal
- `getMealLogs(date?)` - Get meal logs
- `getMealPlan()` - Get current meal plan
- `generateMealPlan()` - Generate new meal plan

### Workout (`workoutApi`)

- `logWorkout(data)` - Log a workout
- `getWorkoutLogs(date?)` - Get workout logs
- `getWorkoutPlan()` - Get current workout plan
- `generateWorkoutPlan()` - Generate new workout plan

### Progress (`progressApi`)

- `logWeight(data)` - Log weight and measurements
- `getWeightLogs(params?)` - Get weight logs
- `getLatestWeight()` - Get latest weight log

### Dashboard (`dashboardApi`)

- `getDashboard()` - Get comprehensive dashboard data

## Error Types

The API client handles different error types:

- **Network Errors** (status 0): Connection failures, timeouts
- **Authentication Errors** (status 401): Invalid/expired tokens
- **Validation Errors** (status 400): Invalid input data
- **Server Errors** (status 5xx): Backend failures

## Retry Logic

Network errors and 5xx server errors are automatically retried up to 3 times with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- Attempt 4: 4 seconds delay

## Development

Run tests:

```bash
npm test -- src/api --run
```

Type check:

```bash
npm run type-check
```
