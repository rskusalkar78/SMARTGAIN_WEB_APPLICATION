// SmartGain Frontend - Error Handling Tests
// Tests for error classification and handling utilities

import { describe, it, expect } from 'vitest';
import {
  classifyError,
  getUserErrorMessage,
  getFieldErrors,
  isNetworkError,
  isAuthError,
  isValidationError,
  isServerError,
  ErrorType,
} from '../errorHandling';
import { ApiError } from '@/api/types';

describe('Error Classification', () => {
  it('should classify network errors correctly', () => {
    const error = new ApiError('Network error', 0);
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.NETWORK);
    expect(classified.userMessage).toBe('Unable to connect. Please check your internet connection.');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should classify authentication errors correctly', () => {
    const error = new ApiError('Unauthorized', 401);
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.AUTHENTICATION);
    expect(classified.userMessage).toBe('Your session has expired. Please log in again.');
    expect(isAuthError(error)).toBe(true);
  });

  it('should classify validation errors correctly', () => {
    const fieldErrors = {
      email: ['Invalid email format'],
      password: ['Password too short'],
    };
    const error = new ApiError('Validation failed', 400, fieldErrors);
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.VALIDATION);
    expect(classified.fieldErrors).toEqual(fieldErrors);
    expect(isValidationError(error)).toBe(true);
  });

  it('should classify server errors correctly', () => {
    const error = new ApiError('Internal server error', 500);
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.SERVER);
    expect(classified.userMessage).toBe('Something went wrong on our end. Please try again later.');
    expect(isServerError(error)).toBe(true);
  });

  it('should classify forbidden errors as authentication errors', () => {
    const error = new ApiError('Forbidden', 403);
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.AUTHENTICATION);
    expect(classified.userMessage).toBe('You do not have permission to perform this action.');
  });

  it('should classify not found errors as client errors', () => {
    const error = new ApiError('Not found', 404);
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.CLIENT);
    expect(classified.userMessage).toBe('The requested resource was not found.');
  });

  it('should handle standard Error instances', () => {
    const error = new Error('Something went wrong');
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.CLIENT);
    expect(classified.message).toBe('Something went wrong');
  });

  it('should handle unknown error types', () => {
    const error = 'string error';
    const classified = classifyError(error);

    expect(classified.type).toBe(ErrorType.UNKNOWN);
    expect(classified.userMessage).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('Error Helper Functions', () => {
  it('should get user error message', () => {
    const error = new ApiError('Network error', 0);
    const message = getUserErrorMessage(error);

    expect(message).toBe('Unable to connect. Please check your internet connection.');
  });

  it('should get field errors from validation error', () => {
    const fieldErrors = {
      email: ['Invalid email format'],
      password: ['Password too short'],
    };
    const error = new ApiError('Validation failed', 400, fieldErrors);
    const extractedErrors = getFieldErrors(error);

    expect(extractedErrors).toEqual(fieldErrors);
  });

  it('should return undefined for field errors when not present', () => {
    const error = new ApiError('Server error', 500);
    const extractedErrors = getFieldErrors(error);

    expect(extractedErrors).toBeUndefined();
  });
});
