// SmartGain Frontend - WorkoutPlan Page Tests

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import WorkoutPlan from '../WorkoutPlan';
import { workoutApi } from '@/api/endpoints/workout';

// Mock the workout API
vi.mock('@/api/endpoints/workout', () => ({
  workoutApi: {
    getWorkoutPlan: vi.fn(),
    generateWorkoutPlan: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock the AppLayout component
vi.mock('@/components/layout/AppLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// Mock the ExerciseCard component
vi.mock('@/components/features/ExerciseCard', () => ({
  default: ({ exercise }: { exercise: any }) => <div data-testid="exercise-card">{exercise.name}</div>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('WorkoutPlan Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    // Mock API to return a pending promise
    (workoutApi.getWorkoutPlan as any).mockImplementation(() => new Promise(() => {}));

    const Wrapper = createWrapper();
    render(<WorkoutPlan />, { wrapper: Wrapper });

    // Should show skeleton loaders
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('should render empty state when no workout plan exists', async () => {
    // Mock API to return empty workout plan
    (workoutApi.getWorkoutPlan as any).mockResolvedValue({
      id: '1',
      userId: '1',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      workouts: [],
      createdAt: '2024-01-01',
    });

    const Wrapper = createWrapper();
    render(<WorkoutPlan />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('No Workout Plan Yet')).toBeInTheDocument();
      expect(screen.getByText('Generate Workout Plan')).toBeInTheDocument();
    });
  });

  it('should render workout plan when data exists', async () => {
    // Mock API to return workout plan with data
    const mockWorkoutPlan = {
      id: '1',
      userId: '1',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      workouts: [
        {
          date: '2024-01-01',
          muscleGroup: 'Chest',
          estimatedDuration: 60,
          exercises: [
            {
              name: 'Push-ups',
              sets: 3,
              reps: 10,
              restPeriod: 60,
              instructions: 'Standard push-ups',
            },
          ],
        },
      ],
      createdAt: '2024-01-01',
    };

    (workoutApi.getWorkoutPlan as any).mockResolvedValue(mockWorkoutPlan);

    const Wrapper = createWrapper();
    render(<WorkoutPlan />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Workout Plan')).toBeInTheDocument();
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });
  });
});