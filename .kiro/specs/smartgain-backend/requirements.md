# Requirements Document

## Introduction

SmartGain is an intelligent weight gain backend system designed to provide personalized nutrition plans, workout recommendations, and adaptive progress tracking. The system focuses on the Indian food context and provides comprehensive calculation engines for BMR, TDEE, and macro distribution with safety thresholds and adaptive intelligence.

## Glossary

- **SmartGain_System**: The complete backend system providing weight gain recommendations
- **Authentication_Service**: JWT-based user authentication and authorization system
- **Calculation_Engine**: Core component for BMR, TDEE, and macro calculations
- **Nutrition_Intelligence**: Component handling macro distribution and food mapping
- **Workout_Engine**: System generating dynamic workout recommendations
- **Adaptive_Intelligence**: Component adjusting plans based on user progress
- **Progress_Tracker**: System monitoring user progress and milestones
- **Database_Layer**: MongoDB-based data persistence layer
- **API_Gateway**: Express.js-based RESTful API interface
- **Security_Middleware**: Input validation and rate limiting components

## Requirements

### Requirement 1: Backend Foundation and Architecture

**User Story:** As a system administrator, I want a robust backend foundation, so that the SmartGain system can handle user requests reliably and scale effectively.

#### Acceptance Criteria

1. THE SmartGain_System SHALL use Node.js with Express.js framework for API development
2. THE API_Gateway SHALL implement RESTful endpoints with /api/v1 structure
3. THE SmartGain_System SHALL organize code using modular folder structure with controllers, models, routes, and middleware
4. THE SmartGain_System SHALL support environment-based configuration for development, staging, and production
5. THE SmartGain_System SHALL implement comprehensive error handling and logging

### Requirement 2: Authentication and User Management

**User Story:** As a user, I want secure account management, so that my personal data and progress are protected.

#### Acceptance Criteria

1. WHEN a user registers with valid credentials, THE Authentication_Service SHALL create a new user account with encrypted password
2. WHEN a user logs in with correct credentials, THE Authentication_Service SHALL return a valid JWT token
3. THE Authentication_Service SHALL use bcrypt for password hashing with minimum 10 salt rounds
4. WHEN accessing protected endpoints, THE API_Gateway SHALL validate JWT tokens and authorize requests
5. THE Authentication_Service SHALL support user profile updates including personal information and goals

### Requirement 3: SmartGain Calculation Engine

**User Story:** As a user, I want accurate calorie and macro calculations, so that I can follow a scientifically-based weight gain plan.

#### Acceptance Criteria

1. WHEN calculating BMR, THE Calculation_Engine SHALL use the Mifflin-St Jeor equation based on user's age, gender, weight, and height
2. WHEN calculating TDEE, THE Calculation_Engine SHALL multiply BMR by activity level factor (1.2 to 1.9)
3. WHEN determining weight gain calories, THE Calculation_Engine SHALL add 300-500 calories to TDEE based on goal intensity
4. THE Calculation_Engine SHALL implement safety thresholds preventing excessive calorie recommendations (maximum 1000 calories above TDEE)
5. THE Calculation_Engine SHALL recalculate recommendations when user stats are updated

### Requirement 4: Nutrition and Macro Intelligence

**User Story:** As a user, I want personalized macro distribution and food recommendations, so that I can achieve my weight gain goals with foods I'm familiar with.

#### Acceptance Criteria

1. THE Nutrition_Intelligence SHALL calculate macro distribution with 25-30% protein, 45-55% carbohydrates, and 20-30% fats
2. THE Nutrition_Intelligence SHALL provide food mapping for Indian context including rice, roti, dal, paneer, eggs, and chicken
3. WHEN generating meal suggestions, THE Nutrition_Intelligence SHALL consider user dietary preferences and restrictions
4. THE Nutrition_Intelligence SHALL calculate nutritional values per 100g for all supported foods
5. THE Nutrition_Intelligence SHALL adjust macro targets based on user's current weight and goals

### Requirement 5: Workout Recommendation Engine

**User Story:** As a user, I want personalized workout plans, so that I can build muscle effectively while gaining weight.

#### Acceptance Criteria

1. THE Workout_Engine SHALL generate workout plans based on user's fitness level (beginner, intermediate, advanced)
2. THE Workout_Engine SHALL recommend 3-5 workout sessions per week with progressive overload
3. WHEN creating workout plans, THE Workout_Engine SHALL focus on compound movements for muscle building
4. THE Workout_Engine SHALL adjust workout intensity based on user's recovery and progress data
5. THE Workout_Engine SHALL provide exercise descriptions and proper form guidance

### Requirement 6: Adaptive Intelligence System

**User Story:** As a user, I want my plan to adapt based on my progress, so that I continue making optimal gains without plateaus.

#### Acceptance Criteria

1. WHEN user weight hasn't increased for 2 weeks, THE Adaptive_Intelligence SHALL increase daily calories by 100-150
2. WHEN user gains weight too rapidly (>1kg per week), THE Adaptive_Intelligence SHALL reduce daily calories by 100-150
3. THE Adaptive_Intelligence SHALL detect overtraining patterns and recommend rest days
4. THE Adaptive_Intelligence SHALL adjust macro ratios based on body composition changes
5. WHEN progress stalls, THE Adaptive_Intelligence SHALL suggest workout plan modifications

### Requirement 7: Database Design and Models

**User Story:** As a system architect, I want efficient data storage and retrieval, so that user data is managed reliably and queries perform well.

#### Acceptance Criteria

1. THE Database_Layer SHALL use MongoDB Atlas for cloud-based data storage
2. THE Database_Layer SHALL implement user model with personal stats, goals, and preferences
3. THE Database_Layer SHALL store body stats history with timestamps for progress tracking
4. THE Database_Layer SHALL log daily calorie intake and macro breakdown
5. THE Database_Layer SHALL maintain workout logs with exercises, sets, reps, and weights

### Requirement 8: Progress Tracking and Analytics

**User Story:** As a user, I want to track my progress and achievements, so that I stay motivated and can see my improvement over time.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL calculate weight gain trends over weekly and monthly periods
2. THE Progress_Tracker SHALL track daily calorie intake streaks and consistency metrics
3. THE Progress_Tracker SHALL identify and celebrate milestones (weight targets, streak achievements)
4. THE Progress_Tracker SHALL generate progress analytics including charts and summaries
5. THE Progress_Tracker SHALL detect and alert about concerning patterns (rapid weight loss, missed targets)

### Requirement 9: User Dashboard APIs

**User Story:** As a frontend developer, I want comprehensive dashboard APIs, so that I can display user progress and recommendations effectively.

#### Acceptance Criteria

1. THE API_Gateway SHALL provide dashboard summary endpoint with current stats and recommendations
2. THE API_Gateway SHALL return user's current meal plan with macro breakdown
3. THE API_Gateway SHALL provide workout plan endpoints with current and upcoming sessions
4. THE API_Gateway SHALL offer progress analytics endpoints with historical data
5. THE API_Gateway SHALL support plan update endpoints for calorie and workout adjustments

### Requirement 10: Security, Validation and Performance

**User Story:** As a system administrator, I want robust security and performance, so that the system protects user data and responds quickly under load.

#### Acceptance Criteria

1. THE Security_Middleware SHALL validate all input data using comprehensive schemas
2. THE Security_Middleware SHALL implement rate limiting to prevent API abuse (100 requests per 15 minutes per IP)
3. THE Security_Middleware SHALL sanitize user inputs to prevent injection attacks
4. THE SmartGain_System SHALL implement CORS policies for secure cross-origin requests
5. THE SmartGain_System SHALL log security events and monitor for suspicious activities

### Requirement 11: Deployment and Scalability

**User Story:** As a DevOps engineer, I want cloud-ready deployment configuration, so that the system can be deployed and scaled efficiently.

#### Acceptance Criteria

1. THE SmartGain_System SHALL support environment variables for all configuration settings
2. THE SmartGain_System SHALL be containerized using Docker for consistent deployments
3. THE SmartGain_System SHALL implement health check endpoints for monitoring
4. THE SmartGain_System SHALL support horizontal scaling with stateless architecture
5. THE SmartGain_System SHALL integrate with cloud logging and monitoring services