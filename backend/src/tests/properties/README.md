# Property-Based Tests

This directory contains property-based tests for the SmartGain backend system using fast-check.

## Test Files

- `setup.test.js` - Fast-check configuration and setup validation
- `inputValidation.test.js` - Property 10: Input validation and security tests
- `rateLimiting.test.js` - Property 11: Rate limiting enforcement tests
- `auth-property.test.js` - Property 4: Authentication security round trip tests
- `bmrCalculation.test.js` - Property 1: BMR calculation accuracy tests

## Running Tests

```bash
# Run all property tests
npm run test:pbt

# Run specific property test
npx vitest run src/tests/properties/inputValidation.test.js
```

## Property Test Guidelines

- Each property test validates universal behaviors across all valid inputs
- Tests use minimum 100 iterations for thorough coverage
- Properties are tagged with requirement validation references
- Tests focus on correctness properties rather than specific examples