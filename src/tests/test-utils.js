import React from 'react';
import { render } from '@testing-library/react';
import { ProfanityFilterProvider } from '../contexts/ProfanityFilterContext';

// Mock the useUserProfile hook for testing
const mockToggleProfanityFilter = jest.fn();
const mockProfileData = {
  profanityFilterEnabled: true,
  toggleProfanityFilter: mockToggleProfanityFilter,
  loading: false
};

// Global mock for useUserProfile to prevent context errors
jest.mock('../hooks/useUserProfile', () => ({
  __esModule: true,
  default: () => mockProfileData
}));

// Custom render function that includes necessary providers
export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <ProfanityFilterProvider>
        {children}
      </ProfanityFilterProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

// Export mock controls for tests
export { mockToggleProfanityFilter, mockProfileData };

// Re-export everything from testing-library/react
export * from '@testing-library/react';

// Override the default render to use the provider version
export { renderWithProviders as render };