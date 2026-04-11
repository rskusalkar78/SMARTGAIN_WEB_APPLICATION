# SmartGain Backend

Intelligent Weight Gain Planning API built with Node.js, Express.js, and MongoDB.

## Features

- **Authentication Service**: JWT-based user authentication and authorization
- **Calculation Engine**: BMR, TDEE, and macro calculations using scientific formulas
- **Nutrition Intelligence**: Indian food database and macro distribution
- **Workout Engine**: Progressive workout plan generation
- **Adaptive Intelligence**: Progress-based plan adjustments
- **Progress Tracking**: Comprehensive analytics and milestone tracking

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Validation**: Joi schemas
- **Testing**: Vitest + fast-check (Property-Based Testing)
- **Security**: Helmet, CORS, Rate limiting

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
# Update MONGODB_URI and JWT_SECRET
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run property-based tests
npm run test:pbt

# Lint code
npm run lint
```

### Production

```bash
# Start production server
npm start
```

## Project Structure

```
src/
├── controllers/          # Request handlers
├── models/              # MongoDB schemas
├── routes/              # API route definitions
├── middleware/          # Custom middleware
├── services/            # Business logic
│   ├── calculation/     # BMR/TDEE calculations
│   ├── nutrition/       # Macro and food intelligence
│   ├── workout/         # Exercise recommendations
│   └── adaptive/        # Progress-based adjustments
├── utils/               # Helper functions
├── config/              # Configuration files
└── tests/               # Test files
    ├── unit/           # Unit tests
    └── properties/     # Property-based tests
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Coming Soon)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `PUT /api/v1/auth/profile` - Update profile

### Dashboard (Coming Soon)
- `GET /api/v1/dashboard/summary` - User dashboard
- `GET /api/v1/nutrition/meal-plan` - Current meal plan
- `GET /api/v1/workout/current-plan` - Current workout plan

## Environment Variables

See `.env.example` for all available configuration options.

Required for production:
- `JWT_SECRET` - Secret key for JWT tokens
- `MONGODB_URI` - MongoDB connection string

## Testing

The project uses a dual testing approach:

### Unit Tests
```bash
npm test
```

### Property-Based Tests
```bash
npm run test:pbt
```

Property-based tests use fast-check to verify universal properties across all inputs, ensuring mathematical accuracy and business rule compliance.

## Security

- JWT authentication with configurable expiration
- bcrypt password hashing (12+ salt rounds)
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet

## Logging

Winston-based logging with:
- Console output in development
- File logging in production
- Error tracking and request logging
- Structured JSON format

## License

Apache-2.0