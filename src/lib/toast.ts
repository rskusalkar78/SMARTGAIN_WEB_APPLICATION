// SmartGain Frontend - Toast Notification Utilities
// Wrapper around sonner for consistent error and success messages

import { toast as sonnerToast } from 'sonner';
import { getUserErrorMessage, logError, classifyError, ErrorType } from './errorHandling';

// ============================================================================
// Toast Helpers
// ============================================================================

/**
 * Display a success toast notification
 */
export function showSuccessToast(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
  });
}

/**
 * Display an error toast notification
 */
export function showErrorToast(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
  });
}

/**
 * Display an info toast notification
 */
export function showInfoToast(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
  });
}

/**
 * Display a warning toast notification
 */
export function showWarningToast(message: string, description?: string) {
  sonnerToast.warning(message, {
    description,
  });
}

/**
 * Display a loading toast notification
 */
export function showLoadingToast(message: string, description?: string) {
  return sonnerToast.loading(message, {
    description,
  });
}

/**
 * Dismiss a toast by ID
 */
export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId);
}

// ============================================================================
// Error Toast Helpers
// ============================================================================

/**
 * Display an error toast from an error object
 * Automatically classifies the error and shows appropriate message
 */
export function showErrorFromException(error: unknown, context?: string) {
  // Log the error
  logError(error, context);

  // Classify and get user-friendly message
  const classified = classifyError(error);
  
  // Show appropriate toast based on error type
  switch (classified.type) {
    case ErrorType.NETWORK:
      sonnerToast.error('Connection Error', {
        description: classified.userMessage,
      });
      break;
      
    case ErrorType.AUTHENTICATION:
      sonnerToast.error('Authentication Error', {
        description: classified.userMessage,
      });
      break;
      
    case ErrorType.VALIDATION:
      sonnerToast.error('Validation Error', {
        description: classified.userMessage,
      });
      break;
      
    case ErrorType.SERVER:
      sonnerToast.error('Server Error', {
        description: classified.userMessage,
      });
      break;
      
    default:
      sonnerToast.error('Error', {
        description: classified.userMessage,
      });
  }
}

/**
 * Display a mutation error toast
 * Used for failed create/update/delete operations
 */
export function showMutationError(operation: string, error: unknown) {
  const message = getUserErrorMessage(error);
  sonnerToast.error(`Failed to ${operation}`, {
    description: message,
  });
  logError(error, `Mutation: ${operation}`);
}

/**
 * Display a mutation success toast
 * Used for successful create/update/delete operations
 */
export function showMutationSuccess(operation: string, description?: string) {
  sonnerToast.success(`Successfully ${operation}`, {
    description,
  });
}

// Re-export the base toast for advanced usage
export { sonnerToast as toast };
