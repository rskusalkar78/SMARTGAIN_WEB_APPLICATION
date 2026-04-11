// SmartGain Frontend - MealPlan Page Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MealPlan from '../MealPlan';
import { nutritionApi } from '@/api/endpoints';

// Mock the API
vi.mock('@/api/endpoints', () => ({
  nutritionApi: {
    getMealPlan: vi.fn(),
  },
}));

// Mock the AuthContext
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
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

describe('MealPlan Page', () => {
  it('should render loading state initially', () => {
    vi.mocked(nutritionApi.getMealPlan).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<MealPlan />, { wrapper: createWrapper() });
    
    // Check for skeleton loaders
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('should render empty state when no meal plan exists', async () => {
    vi.mocked(nutritionApi.getMealPlan).mockResolvedValue({
      id: '1',
      userId: '1',
      startDate: '2026-02-10',
      endDate: '2026-02-16',
      meals: [],
      createdAt: '2026-02-10',
    });

    render(<MealPlan />, { wrapper: createWrapper() });
    
    // Wait for the empty state to appear
    const heading = await screen.findByText('No Meal Plan Yet');
    expect(heading).toBeTruthy();
    
    const button = screen.getByText('Generate Meal Plan');
    expect(button).toBeTruthy();
  });

  it('should render meal plan when data exists', async () => {
    const mockMealPlan = {
      id: '1',
      userId: '1',
      startDate: '2026-02-10',
      endDate: '2026-02-16',
      meals: [
        {
          date: '2026-02-10',
          breakfast: {
            name: 'Oatmeal with Berries',
            ingredients: ['Oats', 'Berries', 'Milk'],
            instructions: 'Cook oats, add berries',
            calories: 350,
            protein: 12,
            carbs: 60,
            fats: 8,
          },
          lunch: {
            name: 'Chicken Salad',
            ingredients: ['Chicken', 'Lettuce', 'Tomatoes'],
            instructions: 'Mix ingredients',
            calories: 450,
            protein: 35,
            carbs: 20,
            fats: 15,
          },
          dinner: {
            name: 'Salmon with Rice',
            ingredients: ['Salmon', 'Rice', 'Vegetables'],
            instructions: 'Grill salmon, cook rice',
            calories: 600,
            protein: 40,
            carbs: 50,
            fats: 20,
          },
          snacks: [],
        },
      ],
      createdAt: '2026-02-10',
    };

    vi.mocked(nutritionApi.getMealPlan).mockResolvedValue(mockMealPlan);

    render(<MealPlan />, { wrapper: createWrapper() });
    
    // Wait for the meal plan to appear
    const heading = await screen.findByText('Meal Plan');
    expect(heading).toBeTruthy();
    
    // Check for meal names
    const breakfast = await screen.findByText('Oatmeal with Berries');
    expect(breakfast).toBeTruthy();
  });
});
