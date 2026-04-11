// SmartGain Frontend - useAuth Hook
// Custom hook to access authentication context

import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '@/contexts/AuthContext';

/**
 * Custom hook to access authentication context
 * 
 * @returns Authentication context value with user state and auth methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
