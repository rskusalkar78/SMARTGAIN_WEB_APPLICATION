// SmartGain Frontend - API Client
// Centralized HTTP client with authentication, error handling, and retry logic

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { ApiError, ApiErrorResponse } from './types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Token Management
// ============================================================================

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

// ============================================================================
// Axios Instance Creation
// ============================================================================

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Configure retry logic with exponential backoff
  axiosRetry(instance, {
    retries: 3,
    retryDelay: (retryCount) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
    },
    retryCondition: (error: AxiosError) => {
      // Retry on network errors and 5xx server errors
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response?.status !== undefined && error.response.status >= 500)
      );
    },
    onRetry: (retryCount, error) => {
      if (import.meta.env.DEV) {
        console.log(`Retry attempt ${retryCount} for ${error.config?.url}`);
      }
    },
  });

  return instance;
};

const apiClient = createAxiosInstance();

// ============================================================================
// Request Interceptor - JWT Token Injection
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject JWT token if available
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add request timestamp for debugging
    if (import.meta.env.DEV) {
      config.metadata = { startTime: new Date().getTime() };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor - Error Handling
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const endTime = new Date().getTime();
      const duration = endTime - response.config.metadata.startTime;
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // Log errors in development mode
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // Clear token
      setAccessToken(null);
      
      // Dispatch custom event for auth context to handle
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      
      // Don't retry the request, let the auth context handle it
      return Promise.reject(
        new ApiError(
          'Your session has expired. Please log in again.',
          401
        )
      );
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          'Unable to connect. Please check your internet connection.',
          0
        )
      );
    }

    // Parse API error response
    const apiErrorResponse = error.response.data;
    
    // Handle validation errors (400)
    if (error.response.status === 400 && apiErrorResponse?.errors) {
      return Promise.reject(
        new ApiError(
          apiErrorResponse.message || 'Validation failed',
          400,
          apiErrorResponse.errors
        )
      );
    }

    // Handle other errors
    return Promise.reject(
      new ApiError(
        apiErrorResponse?.message || 'Something went wrong. Please try again.',
        error.response.status,
        apiErrorResponse?.errors
      )
    );
  }
);

// ============================================================================
// Request Cancellation Support
// ============================================================================

export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export const isCancel = axios.isCancel;

// ============================================================================
// API Client Interface
// ============================================================================

export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

// ============================================================================
// Exported API Client Methods
// ============================================================================

const client: ApiClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
};

export default client;
