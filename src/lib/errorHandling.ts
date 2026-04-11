// SmartGain Frontend - Error Handling Utilities
// Classify and format errors for user-friendly display

import { ApiError } from '@/api/types';
import { AxiosError } from 'axios';

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;
  originalError: Error;
}

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classifies an error and returns a user-friendly error object
 * @param error - The error to classify
 * @returns ClassifiedError object with type and user-friendly message
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return classifyApiError(error);
  }

  // Handle Axios errors
  if (isAxiosError(error)) {
    return classifyAxiosError(error);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      type: ErrorType.CLIENT,
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      originalError: error,
    };
  }

  // Handle unknown error types
  return {
    type: ErrorType.UNKNOWN,
    message: String(error),
    userMessage: 'An unexpected error occurred. Please try again.',
    originalError: new Error(String(error)),
  };
}

/**
 * Classifies an ApiError instance
 */
function classifyApiError(error: ApiError): ClassifiedError {
  const statusCode = error.statusCode;

  // Network errors (no status code)
  if (statusCode === 0) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: 'Unable to connect. Please check your internet connection.',
      statusCode,
      originalError: error,
    };
  }

  // Authentication errors (401)
  if (statusCode === 401) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: error.message,
      userMessage: 'Your session has expired. Please log in again.',
      statusCode,
      originalError: error,
    };
  }

  // Validation errors (400)
  if (statusCode === 400) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      userMessage: error.message || 'Please check your input and try again.',
      statusCode,
      fieldErrors: error.errors,
      originalError: error,
    };
  }

  // Forbidden errors (403)
  if (statusCode === 403) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: error.message,
      userMessage: 'You do not have permission to perform this action.',
      statusCode,
      originalError: error,
    };
  }

  // Not found errors (404)
  if (statusCode === 404) {
    return {
      type: ErrorType.CLIENT,
      message: error.message,
      userMessage: 'The requested resource was not found.',
      statusCode,
      originalError: error,
    };
  }

  // Server errors (500+)
  if (statusCode >= 500) {
    return {
      type: ErrorType.SERVER,
      message: error.message,
      userMessage: 'Something went wrong on our end. Please try again later.',
      statusCode,
      originalError: error,
    };
  }

  // Other client errors (4xx)
  if (statusCode >= 400 && statusCode < 500) {
    return {
      type: ErrorType.CLIENT,
      message: error.message,
      userMessage: error.message || 'Something went wrong. Please try again.',
      statusCode,
      originalError: error,
    };
  }

  // Fallback for unexpected status codes
  return {
    type: ErrorType.UNKNOWN,
    message: error.message,
    userMessage: 'An unexpected error occurred. Please try again.',
    statusCode,
    originalError: error,
  };
}

/**
 * Classifies an Axios error
 */
function classifyAxiosError(error: AxiosError): ClassifiedError {
  // Network errors (no response)
  if (!error.response) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: 'Unable to connect. Please check your internet connection.',
      originalError: error,
    };
  }

  // Convert to ApiError and classify
  const apiError = new ApiError(
    error.message,
    error.response.status,
    (error.response.data as any)?.errors
  );

  return classifyApiError(apiError);
}

/**
 * Type guard to check if an error is an Axios error
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

// ============================================================================
// Error Message Helpers
// ============================================================================

/**
 * Gets a user-friendly error message from any error
 * @param error - The error to get a message from
 * @returns User-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  const classified = classifyError(error);
  return classified.userMessage;
}

/**
 * Gets field-level validation errors from an error
 * @param error - The error to extract field errors from
 * @returns Record of field names to error messages, or undefined
 */
export function getFieldErrors(error: unknown): Record<string, string[]> | undefined {
  const classified = classifyError(error);
  return classified.fieldErrors;
}

/**
 * Checks if an error is a network error
 * @param error - The error to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.type === ErrorType.NETWORK;
}

/**
 * Checks if an error is an authentication error
 * @param error - The error to check
 * @returns True if the error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.type === ErrorType.AUTHENTICATION;
}

/**
 * Checks if an error is a validation error
 * @param error - The error to check
 * @returns True if the error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.type === ErrorType.VALIDATION;
}

/**
 * Checks if an error is a server error
 * @param error - The error to check
 * @returns True if the error is a server error
 */
export function isServerError(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.type === ErrorType.SERVER;
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Logs an error to the console in development mode
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    const classified = classifyError(error);
    
    console.error('[Error]', {
      context,
      type: classified.type,
      message: classified.message,
      userMessage: classified.userMessage,
      statusCode: classified.statusCode,
      fieldErrors: classified.fieldErrors,
      originalError: classified.originalError,
    });

    // Log stack trace if available
    if (classified.originalError.stack) {
      console.error('[Stack Trace]', classified.originalError.stack);
    }
  }

  // In production, you would send this to an error tracking service
  // Example: Sentry.captureException(error, { tags: { context } });
}

/**
 * Logs an error and returns the user-friendly message
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 * @returns User-friendly error message
 */
export function logAndGetErrorMessage(error: unknown, context?: string): string {
  logError(error, context);
  return getUserErrorMessage(error);
}
