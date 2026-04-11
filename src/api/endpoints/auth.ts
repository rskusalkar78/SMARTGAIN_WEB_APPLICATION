// SmartGain Frontend - Authentication API Endpoints

import client from '../client';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
} from '../types';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login with email and password
   * @param credentials - User login credentials
   * @returns Authentication response with user data and tokens
   */
  login: (credentials: LoginCredentials): Promise<AuthResponse> => {
    return client.post<AuthResponse>('/auth/login', credentials);
  },

  /**
   * Register a new user account
   * @param data - User registration data
   * @returns Authentication response with user data and tokens
   */
  register: (data: RegisterData): Promise<AuthResponse> => {
    return client.post<AuthResponse>('/auth/register', data);
  },

  /**
   * Refresh the access token using the refresh token
   * @returns New access token
   */
  refresh: (): Promise<RefreshTokenResponse> => {
    return client.post<RefreshTokenResponse>('/auth/refresh');
  },

  /**
   * Logout the current user
   * Clears server-side session and invalidates tokens
   */
  logout: (): Promise<void> => {
    return client.post<void>('/auth/logout');
  },
};
