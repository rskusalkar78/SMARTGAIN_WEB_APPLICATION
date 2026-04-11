// SmartGain Frontend - Authentication Context
// Manages authentication state and provides auth methods throughout the app

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/api/endpoints/auth';
import { setAccessToken, getAccessToken } from '@/api/client';
import { User, LoginCredentials, RegisterData } from '@/api/types';

// ============================================================================
// Types
// ============================================================================

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context Creation
// ============================================================================

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ============================================================================
  // Token Refresh Function
  // ============================================================================

  const refreshToken = useCallback(async () => {
    try {
      const response = await authApi.refresh();
      setAccessToken(response.accessToken);
      
      // After refreshing token, we should fetch user data
      // For now, we'll keep the existing user data
      // In a real app, the refresh endpoint might return user data too
    } catch (error) {
      // Refresh failed, clear auth state
      setUser(null);
      setAccessToken(null);
      throw error;
    }
  }, []);

  // ============================================================================
  // Login Function
  // ============================================================================

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      
      // Store JWT token in memory
      setAccessToken(response.accessToken);
      
      // Store user data in state
      setUser(response.user);
      
      // Refresh token is stored in httpOnly cookie by the backend
    } catch (error) {
      // Clear any existing auth state on login failure
      setUser(null);
      setAccessToken(null);
      throw error;
    }
  }, []);

  // ============================================================================
  // Register Function
  // ============================================================================

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      
      // Store JWT token in memory
      setAccessToken(response.accessToken);
      
      // Store user data in state
      setUser(response.user);
      
      // Refresh token is stored in httpOnly cookie by the backend
    } catch (error) {
      // Clear any existing auth state on registration failure
      setUser(null);
      setAccessToken(null);
      throw error;
    }
  }, []);

  // ============================================================================
  // Logout Function
  // ============================================================================

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint to clear httpOnly cookie
      await authApi.logout();
    } catch (error) {
      // Log error but continue with local logout
      if (import.meta.env.DEV) {
        console.error('Logout API call failed:', error);
      }
    } finally {
      // Always clear local auth state
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // ============================================================================
  // Handle 401 Unauthorized Events
  // ============================================================================

  useEffect(() => {
    const handleUnauthorized = async () => {
      // Try to refresh the token
      try {
        await refreshToken();
      } catch (error) {
        // Refresh failed, user needs to log in again
        setUser(null);
        setAccessToken(null);
      }
    };

    // Listen for unauthorized events from API client
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [refreshToken]);

  // ============================================================================
  // Persist Auth State Across Page Refreshes
  // ============================================================================

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check if we have a token in memory (from previous session)
        const token = getAccessToken();
        
        if (!token) {
          // No token in memory, try to refresh using httpOnly cookie
          try {
            await refreshToken();
            // If refresh succeeds, we need to fetch user data
            // For now, we'll assume the backend returns user data with refresh
            // In a production app, you might need a separate /auth/me endpoint
          } catch (error) {
            // No valid session, user is not authenticated
            setUser(null);
          }
        }
        // If we have a token, the user state should already be set
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Auth initialization error:', error);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshToken]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
