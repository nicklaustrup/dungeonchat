import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfanityFilterProvider, useProfanityFilterContext } from '../ProfanityFilterContext';

// Mock the useCachedUserProfile hook
const mockToggleProfanityFilter = jest.fn();
const mockProfileData = {
  profanityFilterEnabled: true,
  toggleProfanityFilter: mockToggleProfanityFilter,
  loading: false
};

jest.mock('../../services/cache', () => ({
  useCachedUserProfile: () => mockProfileData
}));

// Test component that uses the context
function TestComponent() {
  const { profanityFilterEnabled, toggleProfanityFilter, loading } = useProfanityFilterContext();
  
  return (
    <div>
      <div data-testid="filter-status">
        Filter: {profanityFilterEnabled ? 'enabled' : 'disabled'}
      </div>
      <div data-testid="loading-status">
        Loading: {loading ? 'true' : 'false'}
      </div>
      <button 
        data-testid="toggle-button" 
        onClick={toggleProfanityFilter}
      >
        Toggle Filter
      </button>
    </div>
  );
}

describe('ProfanityFilterContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileData.profanityFilterEnabled = true;
    mockProfileData.loading = false;
  });

  test('provides filter state to children', () => {
    render(
      <ProfanityFilterProvider>
        <TestComponent />
      </ProfanityFilterProvider>
    );

    expect(screen.getByTestId('filter-status')).toHaveTextContent('Filter: enabled');
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading: false');
  });

  test('allows toggling filter through context', async () => {
    mockToggleProfanityFilter.mockResolvedValueOnce(false);
    
    render(
      <ProfanityFilterProvider>
        <TestComponent />
      </ProfanityFilterProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');
    fireEvent.click(toggleButton);

    expect(mockToggleProfanityFilter).toHaveBeenCalled();
  });

  test('updates when filter state changes', async () => {
    const { rerender } = render(
      <ProfanityFilterProvider>
        <TestComponent />
      </ProfanityFilterProvider>
    );

    expect(screen.getByTestId('filter-status')).toHaveTextContent('Filter: enabled');

    // Simulate state change
    mockProfileData.profanityFilterEnabled = false;
    
    rerender(
      <ProfanityFilterProvider>
        <TestComponent />
      </ProfanityFilterProvider>
    );

    expect(screen.getByTestId('filter-status')).toHaveTextContent('Filter: disabled');
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useProfanityFilterContext must be used within a ProfanityFilterProvider');
    
    consoleSpy.mockRestore();
  });
});