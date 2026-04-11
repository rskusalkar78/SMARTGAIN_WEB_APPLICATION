/**
 * Custom error classes for the SmartGain backend
 */

export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class CalculationError extends AppError {
  constructor(message = 'Calculation failed') {
    super(message, 500, 'CALCULATION_ERROR');
  }
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error, requestId = null) {
  return {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details || null,
      timestamp: new Date().toISOString(),
      requestId: requestId
    }
  };
}