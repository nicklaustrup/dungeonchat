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

// Mock useUserProfile hook to prevent Firebase errors in tests
jest.mock('../hooks/useUserProfile', () => ({
  __esModule: true,
  useUserProfile: () => ({
    profile: mockProfileData,
    loading: false,
    error: null,
    needsOnboarding: false,
    isProfileComplete: true,
    profanityFilterEnabled: false,
    toggleProfanityFilter: jest.fn()
  }),
  default: () => ({
    profile: mockProfileData,
    loading: false,
    error: null,
    needsOnboarding: false,
    isProfileComplete: true,
    profanityFilterEnabled: false,
    toggleProfanityFilter: jest.fn()
  })
}));

// Mock useUserProfileData hook to prevent Firebase errors in tests
jest.mock('../hooks/useUserProfileData', () => ({
  __esModule: true,
  useUserProfileData: () => ({
    profileData: null,
    loading: false,
    error: null
  }),
  default: () => ({
    profileData: null,
    loading: false,
    error: null
  })
}));

// Mock cached hooks to prevent Firebase errors in tests
jest.mock('../services/cache', () => ({
  __esModule: true,
  useCachedUserProfile: () => ({
    profile: mockProfileData,
    loading: false,
    error: null,
    updateProfile: jest.fn(),
    updateUsername: jest.fn(),
    uploadPicture: jest.fn(),
    deletePicture: jest.fn(),
    checkUsernameAvailability: jest.fn(),
    createProfile: jest.fn(),
    refresh: jest.fn(),
    invalidate: jest.fn(),
    updatePrivacySettings: jest.fn(),
    toggleProfanityFilter: mockToggleProfanityFilter,
    getDisplayInfo: jest.fn(),
    profanityFilterEnabled: true,
    isProfileComplete: true,
    needsOnboarding: false
  }),
  useCachedUserProfileData: (userId) => ({
    profileData: null, // Return null so components use the displayName from message
    loading: false,
    error: null,
    refresh: jest.fn(),
    invalidate: jest.fn()
  }),
  useJoinedCampaigns: () => ({
    campaigns: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
    invalidate: jest.fn()
  }),
  useCachedCampaign: (id) => ({
    campaign: id ? { id, name: 'Test Campaign' } : null,
    loading: false,
    error: null,
    refresh: jest.fn(),
    invalidate: jest.fn()
  }),
  useUserCharacters: () => ({
    characters: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
    invalidate: jest.fn()
  }),
  useCampaignCharacters: (id) => ({
    characters: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
    invalidate: jest.fn()
  }),
  useCachedCharacter: (id) => ({
    character: id ? { id, name: 'Test Character' } : null,
    loading: false,
    error: null,
    refresh: jest.fn(),
    invalidate: jest.fn()
  })
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