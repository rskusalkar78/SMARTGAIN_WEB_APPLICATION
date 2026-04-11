# Error Handling System

This document describes the comprehensive error handling system implemented in the SmartGain Frontend application.

## Overview

The error handling system provides:
- **Error Classification**: Automatically categorizes errors (network, auth, validation, server, client)
- **User-Friendly Messages**: Converts technical errors into readable messages
- **Toast Notifications**: Non-intrusive error and success notifications
- **Error Logging**: Development logging with production error tracking preparation
- **Error Boundaries**: React component error catching and recovery

## Components

### 1. ErrorBoundary Component (`src/components/ErrorBoundary.tsx`)

Catches React component errors and prevents the entire app from crashing.

**Usage:**
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Displays user-friendly error message
- Provides "Try Again" button to reset error state
- Provides "Go Home" button to navigate back
- Shows error details in development mode
- Supports custom fallback components

### 2. Error Classification (`src/lib/errorHandling.ts`)

Classifies errors into categories and provides user-friendly messages.

**Error Types:**
- `NETWORK`: Connection failures, timeouts
- `AUTHENTICATION`: 401, 403 errors
- `VALIDATION`: 400 errors with field-level validation
- `SERVER`: 500+ errors
- `CLIENT`: 4xx errors, component errors
- `UNKNOWN`: Unclassified errors

**Usage:**
```typescript
import { classifyError, getUserErrorMessage, isNetworkError } from '@/lib/errorHandling';

try {
  await someApiCall();
} catch (error) {
  const classified = classifyError(error);
  console.log(classified.type); // ErrorType.NETWORK
  console.log(classified.userMessage); // "Unable to connect..."
  
  // Or get just the message
  const message = getUserErrorMessage(error);
  
  // Or check error type
  if (isNetworkError(error)) {
    // Handle network error
  }
}
```

### 3. Toast Notifications (`src/lib/toast.ts`)

Wrapper around sonner for consistent error and success messages.

**Usage:**
```typescript
import { 
  showSuccessToast, 
  showErrorToast, 
  showErrorFromException,
  showMutationSuccess,
  showMutationError 
} from '@/lib/toast';

// Success toast
showSuccessToast('Operation completed', 'Your data has been saved.');

// Error toast
showErrorToast('Operation failed', 'Please try again.');

// Error from exception (auto-classifies)
try {
  await someApiCall();
} catch (error) {
  showErrorFromException(error, 'API Call Context');
}

// Mutation helpers
showMutationSuccess('save profile', 'Your profile has been updated.');
showMutationError('save profile', error);
```

### 4. Error Logger (`src/lib/errorLogger.ts`)

Centralized error logging with production error tracking preparation.

**Usage:**
```typescript
import { logError, initErrorTracking } from '@/lib/errorLogger';

// Log an error
try {
  await someOperation();
} catch (error) {
  logError(error, 'Operation Context');
}

// Initialize error tracking (optional, for production)
initErrorTracking({
  enabled: true,
  dsn: 'your-sentry-dsn',
  environment: 'production',
});
```

**Features:**
- Logs to console in development
- Structured error logging
- Prepares for production error tracking (Sentry, etc.)
- Includes context, stack traces, and metadata

## Integration Examples

### React Query Mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showMutationSuccess, showMutationError } from '@/lib/toast';
import { logError } from '@/lib/errorLogger';

export function useMyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      return await api.post('/endpoint', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myData'] });
      showMutationSuccess('save data', 'Your data has been saved.');
    },
    onError: (error) => {
      logError(error, 'My Mutation');
      showMutationError('save data', error);
    },
  });
}
```

### Form Submission

```typescript
import { showErrorFromException, showSuccessToast } from '@/lib/toast';

async function handleSubmit(data: FormData) {
  try {
    await api.post('/submit', data);
    showSuccessToast('Form submitted', 'Your form has been submitted successfully.');
  } catch (error) {
    showErrorFromException(error, 'Form Submission');
  }
}
```

### Component Error Handling

```typescript
import { useEffect } from 'react';
import { logError } from '@/lib/errorLogger';
import { showErrorToast } from '@/lib/toast';

function MyComponent() {
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.get('/data');
        // Use data
      } catch (error) {
        logError(error, 'MyComponent Data Fetch');
        showErrorToast('Failed to load data', 'Please try refreshing the page.');
      }
    }
    
    fetchData();
  }, []);
  
  return <div>...</div>;
}
```

## Best Practices

1. **Always log errors**: Use `logError()` for all caught errors
2. **Use appropriate toast types**: Success for mutations, error for failures
3. **Provide context**: Include context string when logging errors
4. **Don't show technical details to users**: Use `getUserErrorMessage()` for user-facing messages
5. **Handle field-level validation**: Use `getFieldErrors()` for form validation
6. **Wrap critical components**: Use ErrorBoundary for components that might crash
7. **Test error scenarios**: Test network failures, validation errors, etc.

## Production Setup

To enable production error tracking:

1. Install error tracking service (e.g., Sentry):
   ```bash
   npm install @sentry/react
   ```

2. Initialize in `src/main.tsx`:
   ```typescript
   import * as Sentry from '@sentry/react';
   import { initErrorTracking } from '@/lib/errorLogger';
   
   if (import.meta.env.PROD) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: import.meta.env.MODE,
     });
     
     initErrorTracking({
       enabled: true,
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: import.meta.env.MODE,
     });
   }
   ```

3. Update `errorLogger.ts` to send to Sentry in `sendToTracker()` method

## Testing

Test error handling by:
- Simulating network failures (disconnect internet)
- Sending invalid data to trigger validation errors
- Testing with expired tokens for auth errors
- Throwing errors in components to test ErrorBoundary
- Checking console logs in development mode
