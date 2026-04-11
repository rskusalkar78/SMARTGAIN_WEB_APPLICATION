// SmartGain Frontend - Error Handling Exports
// Centralized exports for all error handling utilities

// Error classification and utilities
export {
  classifyError,
  getUserErrorMessage,
  getFieldErrors,
  isNetworkError,
  isAuthError,
  isValidationError,
  isServerError,
  logError as logErrorToConsole,
  logAndGetErrorMessage,
  ErrorType,
  type ClassifiedError,
} from './errorHandling';

// Toast notifications
export {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  showLoadingToast,
  dismissToast,
  showErrorFromException,
  showMutationError,
  showMutationSuccess,
  toast,
} from './toast';

// Error logging
export {
  logError,
  initErrorTracking,
} from './errorLogger';

// Error boundary component
export { default as ErrorBoundary } from '@/components/ErrorBoundary';
