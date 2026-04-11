// SmartGain Frontend - Protected Route Component
// Guards routes that require authentication

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// ============================================================================
// Protected Route Component
// ============================================================================

/**
 * ProtectedRoute component that guards routes requiring authentication
 * 
 * Features:
 * - Checks authentication status before rendering children
 * - Allows guest mode access (when user has activated a plan without login)
 * - Redirects to login if unauthenticated and not in guest mode
 * - Stores intended destination for post-login redirect
 * - Shows loading indicator during auth verification
 * 
 * @param children - The protected content to render if authenticated or in guest mode
 * @param redirectTo - The path to redirect to if unauthenticated (default: '/login')
 * 
 * @example
 * ```tsx
 * <Route path="/app/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 * ```
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Check if user is in guest mode
  const isGuestMode = localStorage.getItem('smartgain_guest_mode') === 'true';

  // Show loading indicator while verifying authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Allow access if authenticated OR in guest mode
  if (!isAuthenticated && !isGuestMode) {
    // Redirect to login if not authenticated and not in guest mode
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated or in guest mode, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
