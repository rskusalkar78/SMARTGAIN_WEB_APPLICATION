// SmartGain Frontend - Error Logging Service
// Centralized error logging with support for production error tracking

import { classifyError, ErrorType } from './errorHandling';

// ============================================================================
// Types
// ============================================================================

interface ErrorLogEntry {
  timestamp: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  context?: string;
  url?: string;
  userAgent?: string;
  stackTrace?: string;
}

interface ErrorTrackerConfig {
  enabled: boolean;
  dsn?: string; // Data Source Name for error tracking service (e.g., Sentry DSN)
  environment: string;
  release?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const config: ErrorTrackerConfig = {
  enabled: import.meta.env.PROD,
  dsn: import.meta.env.VITE_ERROR_TRACKER_DSN,
  environment: import.meta.env.MODE || 'development',
  release: import.meta.env.VITE_APP_VERSION,
};

// ============================================================================
// Error Logger Class
// ============================================================================

class ErrorLogger {
  private config: ErrorTrackerConfig;

  constructor(config: ErrorTrackerConfig) {
    this.config = config;
  }

  /**
   * Log an error with context
   */
  log(error: unknown, context?: string): void {
    const classified = classifyError(error);
    const entry = this.createLogEntry(classified, context);

    // Always log to console in development
    if (import.meta.env.DEV) {
      this.logToConsole(entry, classified.originalError);
    }

    // Send to error tracking service in production
    if (this.config.enabled && this.config.dsn) {
      this.sendToTracker(entry, classified.originalError);
    }
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    classified: ReturnType<typeof classifyError>,
    context?: string
  ): ErrorLogEntry {
    return {
      timestamp: new Date().toISOString(),
      type: classified.type,
      message: classified.message,
      userMessage: classified.userMessage,
      statusCode: classified.statusCode,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace: classified.originalError.stack,
    };
  }

  /**
   * Log to browser console with formatting
   */
  private logToConsole(entry: ErrorLogEntry, originalError: Error): void {
    console.group(`[Error Logger] ${entry.type.toUpperCase()}`);
    console.error('Message:', entry.message);
    console.error('User Message:', entry.userMessage);
    
    if (entry.context) {
      console.error('Context:', entry.context);
    }
    
    if (entry.statusCode) {
      console.error('Status Code:', entry.statusCode);
    }
    
    console.error('URL:', entry.url);
    console.error('Timestamp:', entry.timestamp);
    
    if (entry.stackTrace) {
      console.error('Stack Trace:', entry.stackTrace);
    }
    
    console.error('Original Error:', originalError);
    console.groupEnd();
  }

  /**
   * Send error to tracking service (e.g., Sentry)
   * This is a placeholder for production error tracking integration
   */
  private sendToTracker(entry: ErrorLogEntry, originalError: Error): void {
    // Placeholder for production error tracking
    // In a real implementation, you would integrate with a service like Sentry:
    //
    // import * as Sentry from '@sentry/react';
    // 
    // Sentry.captureException(originalError, {
    //   tags: {
    //     errorType: entry.type,
    //     context: entry.context,
    //   },
    //   extra: {
    //     userMessage: entry.userMessage,
    //     statusCode: entry.statusCode,
    //     url: entry.url,
    //   },
    // });

    // For now, just log that we would send to tracker
    if (import.meta.env.DEV) {
      console.log('[Error Logger] Would send to tracker in production:', entry);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorTrackerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const errorLogger = new ErrorLogger(config);

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * Log an error with optional context
 */
export function logError(error: unknown, context?: string): void {
  errorLogger.log(error, context);
}

/**
 * Initialize error tracking with custom configuration
 */
export function initErrorTracking(config: Partial<ErrorTrackerConfig>): void {
  errorLogger.updateConfig(config);
}

export default errorLogger;
