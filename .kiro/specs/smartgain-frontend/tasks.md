# Implementation Plan: SmartGain Frontend

## Overview

This implementation plan converts the SmartGain Frontend design into discrete, actionable coding tasks. The approach follows an incremental strategy: establish the foundation (API client, auth), build core features (dashboard, logging), add advanced features (progress tracking, plans), and finish with polish (accessibility, performance, offline support).

Each task builds on previous work, with no orphaned code. Testing tasks are marked as optional (*) to allow for faster MVP delivery while maintaining the option for comprehensive testing.

## Tasks

### Phase 1: Foundation & API Integration

- [x] 1. Set up API client and authentication foundation
  - [x] 1.1 Create Axios API client with interceptors (`src/api/client.ts`)
    - Implement request/response interceptors for JWT token injection (Req 1.2)
    - Add retry logic with exponential backoff for network errors (Req 1.4)
    - Implement request cancellation on component unmount (Req 1.7)
    - Add error parsing for validation errors (Req 1.6)
    - Configure base URL from environment variables
  - [x] 1.2 Create API endpoint modules
    - Create `src/api/endpoints/auth.ts` with login, register, refresh, logout endpoints
    - Create `src/api/endpoints/nutrition.ts` with calculate, logMeal, getMealLogs, getMealPlan endpoints
    - Create `src/api/endpoints/workout.ts` with logWorkout, getWorkoutLogs, getWorkoutPlan endpoints
    - Create `src/api/endpoints/progress.ts` with logWeight, getWeightLogs endpoints
    - Create `src/api/endpoints/dashboard.ts` with getDashboard endpoint
  - [x] 1.3 Create TypeScript types for API requests/responses (`src/api/types.ts`)
    - Define all request/response interfaces matching backend API
    - Define error response types
    - Export all types for use in components

- [x] 2. Implement authentication system
  - [x] 2.1 Create Auth Context (`src/contexts/AuthContext.tsx`)
    - Implement AuthProvider with user state management (Req 2.3)
    - Add login, register, logout, refreshToken methods (Req 2.1, 2.2, 2.7)
    - Store JWT in memory and refresh token in httpOnly cookie (Req 2.3)
    - Implement automatic token refresh on 401 errors (Req 2.4, 2.5)
    - Persist auth state across page refreshes (Req 12.6)
  - [x] 2.2 Create useAuth hook (`src/hooks/useAuth.ts`)
    - Export hook to access auth context
    - Provide isAuthenticated, user, login, register, logout methods
  - [x] 2.3 Create Login page (`src/pages/Login.tsx`)
    - Build login form with email and password fields
    - Add form validation with Zod (Req 2.6, 13.3, 13.4)
    - Display error messages for invalid credentials (Req 2.8)
    - Prevent multiple simultaneous login attempts (Req 2.9)
    - Redirect to dashboard on success (Req 2.2)
  - [x] 2.4 Create Register page (`src/pages/Register.tsx`)
    - Build registration form with name, email, password fields
    - Add form validation with Zod (Req 2.6)
    - Display error messages for validation failures
    - Redirect to onboarding/calculator on success (Req 2.1)
  - [x] 2.5 Create ProtectedRoute component (`src/components/ProtectedRoute.tsx`)
    - Check authentication status before rendering (Req 3.1, 3.3)
    - Redirect to login if unauthenticated (Req 3.1)
    - Store intended destination for post-login redirect (Req 3.2)
    - Show loading indicator during auth verification (Req 3.4)
  - [x] 2.6 Update App.tsx routing
    - Add routes for /login, /register
    - Wrap /app/* routes with ProtectedRoute
    - Configure public routes (/, /calculator) (Req 3.5)

### Phase 2: Core Dashboard & Data Display

- [x] 3. Build user dashboard
  - [x] 3.1 Create Dashboard layout (`src/pages/Dashboard.tsx`)
    - Create AppLayout component with header, sidebar, main content area
    - Add navigation menu with links to all app sections
    - Implement responsive mobile navigation (Req 15.2)
  - [x] 3.2 Implement Dashboard data fetching
    - Create React Query hook for dashboard data (Req 12.1, 12.2)
    - Fetch user profile, today's stats, weekly progress (Req 4.1, 4.2)
    - Display skeleton loaders during loading (Req 4.5)
    - Handle errors with retry button (Req 4.6)
  - [x] 3.3 Create Dashboard components
    - Create `DashboardHeader` component with welcome message
    - Create `StatsOverview` component showing weight, target, calories (Req 4.1)
    - Create `TodaySummary` component showing logged meals, workouts, calories (Req 4.2)
    - Create `QuickActions` component with action buttons (Req 4.3)
    - Create `WeeklyProgress` component with weight trend chart (Req 4.4)
  - [x] 3.4 Implement auto-refresh logic
    - Add automatic data refresh after 5 minutes of inactivity (Req 4.7)
    - Implement background refetching on window focus (Req 12.5)

### Phase 3: Data Logging Features

- [x] 4. Implement meal logging
  - [x] 4.1 Create MealLogger component (`src/components/features/MealLogger.tsx`)
    - Build form with fields for name, meal type, calories, macros (Req 6.1)
    - Add Zod validation for positive numbers (Req 6.2, 13.5)
    - Display field-level error messages (Req 13.2)
    - Show running daily calorie total (Req 6.8)
  - [x] 4.2 Implement meal logging mutation
    - Create React Query mutation for logging meals (Req 6.3)
    - Implement optimistic updates (Req 12.4)
    - Show success toast and clear form on success (Req 6.4)
    - Preserve form data on error (Req 6.5)
    - Invalidate dashboard and meal logs queries (Req 12.3)
  - [x] 4.3 Create meal logging page/route
    - Add route at /app/nutrition/log
    - Integrate MealLogger component
    - Add navigation link in sidebar

- [x] 5. Implement workout logging
  - [x] 5.1 Create WorkoutLogger component (`src/components/features/WorkoutLogger.tsx`)
    - Build form with fields for type, duration, intensity (Req 7.1)
    - Add Zod validation for positive duration (Req 7.2, 13.5)
    - Display field-level error messages
    - Show workout history for current week (Req 7.8)
  - [x] 5.2 Implement workout logging mutation
    - Create React Query mutation for logging workouts (Req 7.3)
    - Implement optimistic updates
    - Show success toast and clear form on success (Req 7.4)
    - Preserve form data on error (Req 7.5)
    - Invalidate dashboard and workout logs queries
  - [x] 5.3 Create workout logging page/route
    - Add route at /app/workout/log
    - Integrate WorkoutLogger component
    - Add navigation link in sidebar

- [x] 6. Implement body measurement logging
  - [x] 6.1 Create MeasurementLogger component (`src/components/features/MeasurementLogger.tsx`)
    - Build form with fields for weight, body fat, optional measurements (Req 8.1)
    - Add Zod validation for weight range (30-300 kg) (Req 8.2)
    - Display previous measurement for comparison (Req 8.7)
  - [x] 6.2 Implement measurement logging mutation
    - Create React Query mutation for logging measurements (Req 8.3)
    - Show success toast and updated trend on success (Req 8.4)
    - Preserve form data on error (Req 8.5)
    - Invalidate progress and dashboard queries

### Phase 4: Progress Tracking & Visualization

- [ ] 7. Build progress tracking page
  - [x] 7.1 Create Progress page (`src/pages/Progress.tsx`)
    - Create page layout with time range selector
    - Add sections for weight chart, calorie chart, workout chart
  - [x] 7.2 Implement TimeRangeSelector component
    - Create selector for 7d, 30d, 90d, all time (Req 5.5)
    - Update all charts when range changes (Req 5.4)
  - [x] 7.3 Create WeightChart component
    - Use Recharts to display weight line chart (Req 5.1)
    - Add interactive tooltips with exact values (Req 5.6)
    - Implement responsive sizing (Req 15.3)
    - Show empty state for insufficient data (Req 5.7)
  - [x] 7.4 Create CalorieChart component
    - Use Recharts to display calorie bar chart (Req 5.2)
    - Show daily intake vs target with color coding (Req 5.8)
    - Add interactive tooltips
  - [x] 7.5 Create WorkoutChart component
    - Display workout completion rate as percentage (Req 5.3)
    - Use color-coded indicators for progress (Req 5.8)
  - [x] 7.6 Implement progress data fetching
    - Create React Query hooks for weight logs, calorie logs, workout logs
    - Filter data by selected time range
    - Handle loading and error states

### Phase 5: Meal & Workout Plans

- [x] 8. Implement meal plan display
  - [x] 8.1 Create MealPlan page (`src/pages/MealPlan.tsx`)
    - Fetch meal plan from backend (Req 10.1)
    - Display meals organized by day and meal type (Req 10.2)
    - Show calorie and macro information (Req 10.3)
    - Display skeleton loaders during loading (Req 10.5)
  - [x] 8.2 Create MealCard component
    - Display meal details with click to expand (Req 10.4)
    - Show ingredients and preparation instructions
    - Add checkbox to mark meals as completed (Req 10.7)
  - [x] 8.3 Handle empty meal plan state
    - Display call-to-action to generate plan (Req 10.6)
    - Link to calculator or plan generation flow

- [x] 9. Implement workout plan display
  - [x] 9.1 Create WorkoutPlan page (`src/pages/WorkoutPlan.tsx`)
    - Fetch workout plan from backend (Req 11.1)
    - Display workouts organized by day and muscle group (Req 11.2)
    - Show exercise details (sets, reps, rest) (Req 11.3)
    - Display skeleton loaders during loading (Req 11.5)
  - [x] 9.2 Create ExerciseCard component
    - Display exercise details with click to expand (Req 11.4)
    - Show instructions and form tips
    - Add checkbox to mark exercises as completed (Req 11.7)
  - [x] 9.3 Handle empty workout plan state
    - Display call-to-action to generate plan (Req 11.6)
    - Link to plan generation flow

### Phase 6: Calculator Integration with Backend

- [x] 10. Integrate calculator with backend API
  - [x] 10.1 Update Calculator component
    - Replace local calculation with API call to backend (Req 9.4)
    - Keep existing 3-step form UI
    - Maintain step validation (Req 9.2, 9.3)
  - [x] 10.2 Implement calculator mutation
    - Create React Query mutation for calculation endpoint
    - Handle loading state during calculation
    - Display error message with retry on failure (Req 9.6)
  - [x] 10.3 Save results for authenticated users
    - If user is authenticated, save results to profile (Req 9.8)
    - Redirect to dashboard after saving
  - [x] 10.4 Update Results component
    - Display backend calculation results
    - Maintain existing UI for results display

### Phase 7: User Profile Management

- [ ] 11. Build profile management page
  - [ ] 11.1 Create Profile page (`src/pages/Profile.tsx`)
    - Fetch and display current profile information (Req 20.1)
    - Create sections for personal info, goals, preferences
  - [ ] 11.2 Create profile update form
    - Add fields for name, email, password (Req 20.2)
    - Implement form validation with Zod (Req 20.3)
    - Add profile picture upload with preview (Req 20.6, 20.7)
  - [ ] 11.3 Implement profile update mutation
    - Create React Query mutation for profile updates (Req 20.4)
    - Show success message on successful update (Req 20.4)
    - Preserve form data on error (Req 20.5)
    - Update auth context with new user data
  - [ ] 11.4 Add goals and preferences section
    - Allow updating goals (target weight, weekly gain, etc.) (Req 20.8)
    - Allow updating preferences (activity level, dietary restrictions)

### Phase 8: Error Handling & Resilience

- [x] 12. Implement comprehensive error handling
  - [x] 12.1 Create ErrorBoundary component (`src/components/ErrorBoundary.tsx`)
    - Catch React component errors (Req 14.1)
    - Display user-friendly error message (Req 14.2)
    - Provide retry button (Req 14.3)
    - Offer navigation back to home (Req 14.7)
  - [x] 12.2 Create error classification utility
    - Classify errors as network, validation, auth, or server (Req 14.5)
    - Return appropriate user-facing messages
  - [x] 12.3 Implement toast notifications
    - Use sonner for non-critical errors (Req 14.8)
    - Display success messages for mutations
  - [x] 12.4 Add error logging
    - Log detailed errors to console in development (Req 1.8, 14.6)
    - Prepare for production error tracking integration

### Phase 9: Performance Optimization

- [x] 13. Implement performance optimizations
  - [x] 13.1 Add code splitting for routes
    - Use React.lazy for route-based lazy loading (Req 16.1)
    - Add Suspense boundaries with loading states
  - [x] 13.2 Optimize chart components
    - Lazy load Recharts components (Req 16.2)
    - Implement virtual scrolling for long data lists (Req 16.5)
  - [x] 13.3 Add search input debouncing
    - Debounce search inputs by 300ms (Req 16.6)
    - Reduce unnecessary API calls
  - [x] 13.4 Optimize images
    - Use appropriate image formats and sizes (Req 16.3)
    - Add lazy loading for images
  - [x] 13.5 Configure React Query for performance
    - Set appropriate stale times and cache times
    - Implement prefetching for likely navigation targets (Req 16.7)

### Phase 10: Accessibility

- [ ] 14. Ensure WCAG 2.1 AA compliance
  - [ ] 14.1 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible (Req 17.2)
    - Test Tab, Enter, arrow key navigation
  - [ ] 14.2 Add ARIA labels and semantic HTML
    - Use semantic HTML elements (Req 17.3)
    - Add ARIA labels for icons and non-text elements (Req 17.4)
    - Announce dynamic content changes to screen readers (Req 17.7)
  - [ ] 14.3 Ensure color contrast compliance
    - Verify minimum 4.5:1 contrast ratio for text (Req 17.5)
    - Add visible focus indicators (Req 17.6)
  - [ ] 14.4 Test with screen readers
    - Test with NVDA/JAWS on Windows or VoiceOver on Mac
    - Verify all content is accessible
  - [ ] 14.5 Support browser zoom
    - Test layouts at 200% zoom (Req 17.8)
    - Ensure no content is cut off or broken

### Phase 11: Animations & Polish

- [ ] 15. Add animations and transitions
  - [ ] 15.1 Implement page transitions
    - Use Framer Motion for page transitions (Req 18.1, 18.2)
    - Add fade and slide effects
  - [ ] 15.2 Add modal and drawer animations
    - Animate modal appearances (Req 18.3)
    - Keep animations under 300ms (Req 18.5)
  - [ ] 15.3 Implement loading animations
    - Use skeleton screens for loading states (Req 18.7)
    - Add spring animations for interactions (Req 18.6)
  - [ ] 15.4 Respect reduced motion preferences
    - Check prefers-reduced-motion setting (Req 18.4)
    - Disable or reduce animations accordingly (Req 18.8)

### Phase 12: Offline Support

- [ ] 16. Implement offline capabilities
  - [ ] 16.1 Configure React Query for offline support
    - Display cached data when offline (Req 19.1)
    - Show offline status banner (Req 19.2)
  - [ ] 16.2 Implement request queueing
    - Queue mutations when offline (Req 19.3)
    - Retry queued requests on reconnection (Req 19.4)
  - [ ] 16.3 Add stale data indicators
    - Indicate which data is cached/stale (Req 19.5)
    - Disable real-time features when offline (Req 19.6)

### Phase 13: Testing - Unit Tests

- [ ] 17. Write unit tests for core functionality
  - [ ] 17.1 Test API client
    - Test JWT token injection
    - Test retry logic
    - Test error parsing
    - Test request cancellation
  - [ ] 17.2 Test authentication
    - Test login flow
    - Test registration flow
    - Test token refresh
    - Test logout
  - [ ] 17.3 Test form validation
    - Test email validation
    - Test password strength validation
    - Test numeric field validation
    - Test required field validation
  - [ ] 17.4 Test components
    - Test Calculator component steps
    - Test MealLogger component
    - Test WorkoutLogger component
    - Test Dashboard components
  - [ ] 17.5 Test hooks
    - Test useAuth hook
    - Test custom React Query hooks
  - [ ] 17.6 Test utilities
    - Test calculation functions
    - Test formatters
    - Test validators

### Phase 14: Testing - Property-Based Tests

- [ ] 18.* Write property-based tests for correctness properties
  - [ ] 18.1* Install and configure fast-check
    - Add fast-check to devDependencies
    - Configure test setup for property tests
  - [ ] 18.2* Create API client property tests (`src/__tests__/properties/api-client.properties.test.ts`)
    - Property 1: Authenticated requests include JWT token
    - Property 2: Network errors trigger retry with exponential backoff
    - Property 3: Validation errors are parsed correctly
    - Property 4: Request cancellation on unmount
  - [ ] 18.3* Create authentication property tests (`src/__tests__/properties/auth.properties.test.ts`)
    - Property 5: Successful authentication stores tokens
    - Property 6: Email and password validation
    - Property 20: Authentication persists across refreshes
  - [ ] 18.4* Create route protection property tests (`src/__tests__/properties/routes.properties.test.ts`)
    - Property 7: Protected routes require authentication
    - Property 8: Public routes are always accessible
  - [ ] 18.5* Create validation property tests (`src/__tests__/properties/validation.properties.test.ts`)
    - Property 10: Numeric validation for meal logs
    - Property 12: Workout duration validation
    - Property 13: Weight range validation
    - Property 22: Positive number validation
    - Property 34: Profile updates are validated
  - [ ] 18.6* Create data logging property tests (`src/__tests__/properties/logging.properties.test.ts`)
    - Property 11: Daily calorie total accuracy
    - Property 14: Form data preservation on error
  - [ ] 18.7* Create calculator property tests (`src/__tests__/properties/calculator.properties.test.ts`)
    - Property 15: Step validation prevents progression
    - Property 16: Authenticated calculator saves results
  - [ ] 18.8* Create state management property tests (`src/__tests__/properties/state.properties.test.ts`)
    - Property 17: API responses are cached
    - Property 18: Mutations invalidate related queries
    - Property 19: Optimistic updates occur before API response
    - Property 21: Queries provide loading and error states
  - [ ] 18.9* Create progress tracking property tests (`src/__tests__/properties/progress.properties.test.ts`)
    - Property 9: Time range filter updates data
  - [ ] 18.10* Create performance property tests (`src/__tests__/properties/performance.properties.test.ts`)
    - Property 25: Search input debouncing
  - [ ] 18.11* Create accessibility property tests (`src/__tests__/properties/accessibility.properties.test.ts`)
    - Property 26: Keyboard navigation support
    - Property 27: ARIA labels for non-text elements
    - Property 28: Focus indicators present
  - [ ] 18.12* Create animation property tests (`src/__tests__/properties/animation.properties.test.ts`)
    - Property 29: Reduced motion preference respected
  - [ ] 18.13* Create offline support property tests (`src/__tests__/properties/offline.properties.test.ts`)
    - Property 30: Cached data displayed when offline
    - Property 31: Offline requests are queued
    - Property 32: Queued requests retry on reconnection
    - Property 33: Features disabled when offline
  - [ ] 18.14* Create error handling property tests (`src/__tests__/properties/errors.properties.test.ts`)
    - Property 23: Error boundary catches component errors
    - Property 24: Error type classification

### Phase 15: Integration & E2E Testing

- [ ] 19.* Write integration tests for critical flows
  - [ ] 19.1* Test authentication flow
    - Test complete registration → login → dashboard flow
    - Test logout and re-login
  - [ ] 19.2* Test meal logging flow
    - Test complete meal logging and dashboard update
    - Test form validation and error handling
  - [ ] 19.3* Test calculator flow
    - Test complete calculator → results → save to profile
    - Test step navigation and validation
  - [ ] 19.4* Test progress tracking flow
    - Test data fetching and chart rendering
    - Test time range filtering

- [ ] 20.* Set up E2E testing with Playwright
  - [ ] 20.1* Install and configure Playwright
  - [ ] 20.2* Write E2E tests for critical user journeys
    - Test: New user registration → calculator → dashboard
    - Test: Login → log meal → view progress
    - Test: Login → view meal plan → mark meal complete
    - Test: Login → log workout → view workout history
    - Test: Login → update profile → verify changes

### Phase 16: Final Polish & Documentation

- [ ] 21. Final optimizations and cleanup
  - [ ] 21.1 Run Lighthouse audit
    - Achieve performance score above 90 (Req 16.4)
    - Fix any accessibility issues
    - Optimize bundle size
  - [ ] 21.2 Add loading states everywhere
    - Ensure all async operations show loading feedback
    - Add skeleton screens for all data fetching
  - [ ] 21.3 Review and improve error messages
    - Ensure all error messages are user-friendly
    - Add helpful guidance for error recovery
  - [ ] 21.4 Test responsive design
    - Test at 320px, 768px, 1024px, 1440px breakpoints (Req 15.6)
    - Verify touch-friendly sizes on mobile (Req 15.4)
  - [ ] 21.5 Add environment configuration
    - Set up .env files for different environments
    - Configure API base URLs
    - Add feature flags if needed
  - [ ] 21.6 Write developer documentation
    - Document project structure
    - Document API integration patterns
    - Document testing approach
    - Add setup instructions for new developers
  