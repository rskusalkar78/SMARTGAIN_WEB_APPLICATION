import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageLoader from "@/components/ui/PageLoader";

// Lazy-loaded routes for code splitting
const Index = React.lazy(() => import("./pages/Index").then(module => ({ default: module.Index })));
const Login = React.lazy(() => import("./pages/Login").then(module => ({ default: module.Login })));
const Register = React.lazy(() => import("./pages/Register").then(module => ({ default: module.Register })));
const Dashboard = React.lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const Nutrition = React.lazy(() => import("./pages/Nutrition").then(module => ({ default: module.Nutrition })));
const Workout = React.lazy(() => import("./pages/Workout").then(module => ({ default: module.Workout })));
const Progress = React.lazy(() => import("./pages/Progress").then(module => ({ default: module.Progress })));
const MealPlan = React.lazy(() => import("./pages/MealPlan").then(module => ({ default: module.MealPlan })));
const WorkoutPlan = React.lazy(() => import("./pages/WorkoutPlan").then(module => ({ default: module.WorkoutPlan })));
const Profile = React.lazy(() => import("./pages/Profile").then(module => ({ default: module.Profile })));
const NotFound = React.lazy(() => import("./pages/NotFound").then(module => ({ default: module.NotFound })));

// Configure QueryClient with performance-focused defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes before considering data stale
      gcTime: 30 * 60 * 1000, // Keep in cache for 30 mins
      refetchOnWindowFocus: false, // Prevent aggressive refetching 
      retry: 2,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Calculator route will be added when integrating with backend in task 10 */}

                {/* Protected Routes */}
                <Route path="/app/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/app/nutrition/log" element={
                  <ProtectedRoute>
                    <Nutrition />
                  </ProtectedRoute>
                } />
                <Route path="/app/workout/log" element={
                  <ProtectedRoute>
                    <Workout />
                  </ProtectedRoute>
                } />
                <Route path="/app/progress" element={
                  <ProtectedRoute>
                    <Progress />
                  </ProtectedRoute>
                } />
                <Route path="/app/nutrition/plan" element={
                  <ProtectedRoute>
                    <MealPlan />
                  </ProtectedRoute>
                } />
                <Route path="/app/workout/plan" element={
                  <ProtectedRoute>
                    <WorkoutPlan />
                  </ProtectedRoute>
                } />
                <Route path="/app/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Additional protected routes will be added in future tasks */}

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
