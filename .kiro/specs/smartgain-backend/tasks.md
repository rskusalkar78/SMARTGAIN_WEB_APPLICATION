# Implementation Plan: SmartGain Backend System

## Overview

This implementation plan converts the SmartGain backend design into discrete coding tasks using Node.js, Express.js, and MongoDB. Tasks are organized to build incrementally from foundation through core services to integration, with property-based testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up project foundation and core infrastructure
  - [x] Initialize Node.js project with Express.js framework
  - [x] Configure MongoDB Atlas connection with Mongoose ODM
  - [x] Set up folder structure (controllers, models, routes, middleware, services, utils, config)
  - [x] Configure environment variables and basic error handling
  - [x] Set up fast-check for property-based testing
  - [x] Configure security middleware (helmet, CORS, rate limiting)
  - [x] Set up Winston logging system
  - [x] Create comprehensive error handling system
  - [x] Add health check endpoint
  - [x] Configure test setup with Vitest
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 7.1, 10.1, 10.2, 10.4, 10.5_

- [x] 2. Implement User model and authentication foundation
  - [x] 2.1 Create User model with Mongoose schema
    - Define user schema with profile, goals, and calculations fields
    - Implement password hashing with bcrypt (12+ salt rounds)
    - Add validation for email uniqueness and password strength
    - Add indexes for performance optimization
    - _Requirements: 2.3, 7.2_

  - [x] 2.2 Implement JWT authentication service
    - Create JWT token generation and validation functions
    - Implement user registration and login logic
    - Add password comparison utilities
    - Create authentication middleware for protected routes
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 2.3 Write property test for authentication security round trip

    - **Property 4: Authentication Security Round Trip**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 2.4 Create authentication routes and controllers
    - Implement POST /api/v1/auth/register endpoint
    - Implement POST /api/v1/auth/login endpoint
    - Add PUT /api/v1/auth/profile for profile updates
    - Add input validation using Joi schemas
    - _Requirements: 2.5, 1.2, 10.1_

  - [x] 2.5 Write property tests for input validation

    - **Property 10: Input Validation and Security**
    - **Validates: Requirements 10.1, 10.3**

- [x] 3. Implement calculation engine service
  - [x] 3.1 Create BMR calculation functions
    - Implement Mifflin-St Jeor equation for men and women
    - Add input validation for age, gender, weight, height
    - Create calculation service module structure
    - _Requirements: 3.1_

  - [x] 3.2 Write property test for BMR calculation accuracy

    - **Property 1: BMR Calculation Accuracy**
    - **Validates: Requirements 3.1**

  - [x] 3.3 Implement TDEE and weight gain calorie calculations
    - Create TDEE calculation with activity level factors
    - Implement weight gain calorie addition with safety thresholds
    - Add recalculation triggers for user stat updates
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.4 Write property test for calculation chain consistency
    - **Property 2: TDEE and Weight Gain Calorie Chain**
    - **Property 12: Calculation Recalculation Consistency**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [x] 4. Implement nutrition intelligence service
  - [x] 4.1 Create Indian food database and nutrition calculations
    - Define food database with rice, roti, dal, paneer, chicken, eggs
    - Implement nutritional value calculations per 100g
    - Add food lookup and macro calculation functions
    - _Requirements: 4.2, 4.4_

  - [ ]* 4.2 Write property test for food database accuracy
    - **Property 15: Food Database Nutritional Accuracy**
    - **Validates: Requirements 4.4**

  - [x] 4.3 Implement macro distribution calculations
    - Create macro target calculation (25-30% protein, 45-55% carbs, 20-30% fats)
    - Implement meal plan generation with dietary preferences
    - Add macro adjustment based on user weight and goals
    - _Requirements: 4.1, 4.3, 4.5_

  - [ ]* 4.4 Write property tests for macro calculations and meal planning
    - **Property 3: Macro Distribution Constraints**
    - **Property 13: Meal Plan Dietary Preference Compliance**
    - **Validates: Requirements 4.1, 4.3**

- [x] 5. Implement data models for logging and tracking
  - [x] 5.1 Create body stats, calorie log, and workout log models
    - Define BodyStats schema with timestamps
    - Create CalorieLog schema with meal breakdown
    - Implement WorkoutLog schema with exercise details
    - Add AdaptationLog schema for tracking changes
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 5.2 Write property test for data persistence completeness
    - **Property 7: Data Persistence Completeness**
    - **Validates: Requirements 7.3, 7.4, 7.5**

- [-] 6. Implement workout engine service
  - [x] 6.1 Create workout plan generation system
    - Define workout templates for beginner, intermediate, advanced levels
    - Implement 3-5 sessions per week with compound movement focus
    - Add exercise database with descriptions and form guidance
    - Create progressive overload logic
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 6.2 Write property test for workout plan structure
    - **Property 6: Workout Plan Structure Consistency**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

  - [-] 6.3 Implement workout intensity adjustment system
    - Add recovery data analysis
    - Implement intensity adjustment based on progress
    - Create overtraining detection logic
    - _Requirements: 5.4, 6.3_

  - [ ]* 6.4 Write property test for overtraining detection
    - **Property 14: Overtraining Detection and Response**
    - **Validates: Requirements 6.3**

- [-] 7. Implement adaptive intelligence service
  - [x] 7.1 Create progress analysis and adaptation logic
    - Implement weight trend analysis (2-week stagnation, rapid gain detection)
    - Add calorie adjustment algorithms (±100-150 calories)
    - Create macro ratio adjustment based on body composition
    - Add workout plan modification suggestions
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 7.2 Write property test for adaptive calorie adjustments
    - **Property 5: Adaptive Calorie Adjustments**
    - **Validates: Requirements 6.1, 6.2**

- [x] 8. Implement progress tracking service
  - [x] 8.1 Create progress calculation and analytics
    - Implement weight trend calculations (weekly, monthly)
    - Add calorie streak tracking and consistency metrics
    - Create milestone detection and celebration system
    - Implement concerning pattern detection (rapid loss, missed targets)
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 8.2 Write property test for progress tracking calculations
    - **Property 8: Progress Tracking Calculations**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 9. Implement API routes and controllers
  - [x] 9.1 Create dashboard and user data routes
    - Implement GET /api/v1/dashboard/summary
    - Add GET /api/v1/nutrition/meal-plan
    - Create GET /api/v1/workout/current-plan
    - Implement GET /api/v1/progress/analytics
    - Add PUT /api/v1/plans/update for plan adjustments
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 9.2 Write property test for API response completeness
    - **Property 9: API Response Completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [x] 9.3 Create data logging routes
    - Implement POST /api/v1/stats/body for body stats logging
    - Add POST /api/v1/nutrition/log for calorie logging
    - Create POST /api/v1/workout/log for workout logging
    - _Requirements: 7.3, 7.4, 7.5_

- [-] 10. Integration and final wiring
  - [x] 10.1 Wire all services together
    - Connect calculation engine to user profile updates
    - Integrate adaptive intelligence with progress tracking
    - Link nutrition intelligence with meal planning routes
    - Connect workout engine with progress data
    - Add main API routes to Express app
    - _Requirements: All requirements integration_

  - [ ]* 10.2 Write integration tests
    - Test end-to-end user registration and profile setup
    - Verify calculation pipeline from BMR to meal plans
    - Test adaptive adjustment triggers and responses
    - _Requirements: All requirements integration_

  - [ ]* 10.3 Write property test for rate limiting enforcement
    - **Property 11: Rate Limiting Enforcement**
    - **Validates: Requirements 10.2**

- [ ] 11. Final validation and testing
  - [ ] 11.1 Comprehensive testing validation
    - Ensure all tests pass
    - Verify all 15 correctness properties are implemented and passing
    - Run integration tests for complete user workflows
    - Test error handling and edge cases
    - _Requirements: All requirements validation_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- Checkpoints ensure incremental validation and early error detection
- Integration tasks ensure all components work together seamlessly