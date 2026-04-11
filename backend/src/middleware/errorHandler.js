import logger from '../utils/logger.js';
import { AppError, formatErrorResponse } from '../utils/errors.js';

/**
 * Global error handling middleware
 */
export function errorHandler(error, req, res, next) {
  let err = { ...error };
  err.message = error.message;

  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Invalid resource ID';
    err = new AppError(message, 400, 'INVALID_ID');
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    err = new AppError(message, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    err = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new AppError(message, 401, 'INVALID_TOKEN');
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new AppError(message, 401, 'TOKEN_EXPIRED');
  }

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json(formatErrorResponse({
    code,
    message: err.message || 'Internal server error',
    details: err.details
  }, req.id));
}

/**
 * Handle unhandled promise rejections
 */
export function handleUnhandledRejection() {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
  });
}

/**
 * Handle uncaught exceptions
 */
export function handleUncaughtException() {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
}