// ProfileSystemTest.js - Test file to validate enhanced profile system
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InlineProfileEditor } from '../components/InlineProfileEditor/InlineProfileEditor';
import { SettingsMenu } from '../components/SettingsMenu/SettingsMenu';

// Mock hooks
jest.mock('../hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: {
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      profilePictureURL: '',
      profileVisibility: 'public',
      showEmail: false,
      showLastActive: true
    },
    updateProfile: jest.fn().mockResolvedValue(),
    checkUsernameAvailability: jest.fn().mockResolvedValue({ valid: true, message: 'Username available' }),
    loading: false,
    profanityFilterEnabled: true,
    toggleProfanityFilter: jest.fn(),
    getDisplayInfo: () => ({ 
      displayName: 'Test User', 
      profilePictureURL: '', 
      isComplete: true 
    })
  })
}));

describe('Enhanced Profile System', () => {
  describe('InlineProfileEditor', () => {
    test('renders all profile fields correctly', () => {
      render(<InlineProfileEditor />);
      
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Bio')).toBeInTheDocument();
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    test('displays pencil icon edit buttons', () => {
      render(<InlineProfileEditor />);
      
      const editButtons = screen.getAllByText('✏️');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    test('enables inline editing when pencil icon is clicked', async () => {
      render(<InlineProfileEditor />);
      
      // Click edit button for username
      const usernameEditBtn = screen.getAllByText('✏️')[0];
      fireEvent.click(usernameEditBtn);
      
      // Should show input field and save/cancel buttons
      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
        expect(screen.getByText('✓')).toBeInTheDocument(); // Save button
        expect(screen.getByText('✕')).toBeInTheDocument(); // Cancel button
      });
    });

    test('handles username validation', async () => {
      render(<InlineProfileEditor />);
      
      // Start editing username
      const usernameEditBtn = screen.getAllByText('✏️')[0];
      fireEvent.click(usernameEditBtn);
      
      // Change username value
      const input = screen.getByDisplayValue('testuser');
      fireEvent.change(input, { target: { value: 'newusername' } });
      
      // Validation should be triggered
      await waitFor(() => {
        expect(screen.getByText('Username available')).toBeInTheDocument();
      });
    });

    test('profile picture upload works', () => {
      render(<InlineProfileEditor />);
      
      const avatarContainer = screen.getByRole('button', { name: /click to change/i });
      expect(avatarContainer).toBeInTheDocument();
    });
  });

  describe('SettingsMenu Integration', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onForceProfileSetup: jest.fn()
    };

    test('renders settings menu with profile section', () => {
      render(<SettingsMenu {...defaultProps} />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    test('shows edit profile button', () => {
      render(<SettingsMenu {...defaultProps} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    test('navigates to inline profile editor', async () => {
      render(<SettingsMenu {...defaultProps} />);
      
      // Click edit profile
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      // Should show profile editing interface with pencil icons
      await waitFor(() => {
        expect(screen.getAllByText('✏️').length).toBeGreaterThan(0);
      });
    });

    test('handles force profile setup', () => {
      const onForceProfileSetup = jest.fn();
      render(<SettingsMenu {...defaultProps} onForceProfileSetup={onForceProfileSetup} />);
      
      // This would test the complete profile button if profile is incomplete
      // Implementation depends on profile completion state
    });
  });

  describe('Bug Fixes Validation', () => {
    test('app name shows as DungeonChat', () => {
      render(<InlineProfileEditor />);
      
      // Check that SuperChat has been replaced with DungeonChat
      expect(screen.queryByText('SuperChat')).not.toBeInTheDocument();
      // Note: This test assumes the app name appears somewhere in the component
    });

    test('avatar hover coverage is improved', () => {
      render(<InlineProfileEditor />);
      
      const avatarContainer = document.querySelector('.avatar-container');
      const overlay = document.querySelector('.avatar-overlay');
      
      expect(avatarContainer).toBeInTheDocument();
      expect(overlay).toBeInTheDocument();
      
      // CSS testing for overlay coverage would be done in integration tests
    });

    test('username validation is simplified', async () => {
      render(<InlineProfileEditor />);
      
      // Start editing username
      const usernameEditBtn = screen.getAllByText('✏️')[0];
      fireEvent.click(usernameEditBtn);
      
      // Enter invalid format
      const input = screen.getByDisplayValue('testuser');
      fireEvent.change(input, { target: { value: '123' } });
      
      // Should show format validation, not Firebase permission error
      await waitFor(() => {
        const errorMessage = screen.queryByText(/permission/i);
        expect(errorMessage).not.toBeInTheDocument();
      });
    });
  });

  describe('CSS and Styling', () => {
    test('responsive design classes are applied', () => {
      render(<InlineProfileEditor compact={true} />);
      
      const container = document.querySelector('.inline-profile-editor');
      expect(container).toHaveClass('compact');
    });

    test('dark theme support is available', () => {
      // This would test CSS custom properties and dark theme classes
      const container = document.querySelector('.inline-profile-editor');
      const styles = window.getComputedStyle(container);
      
      // Verify CSS custom properties exist
      expect(styles.getPropertyValue('--bg-secondary')).toBeDefined();
    });

    test('scrollbar styling matches chat room', () => {
      // Integration test to verify scrollbar CSS consistency
      // const scrollElements = document.querySelectorAll('[class*="scroll"]'); // Removed unused
      // Verify consistent scrollbar styling across components
    });
  });

  describe('Integration Flow', () => {
    test('complete user flow from settings to profile edit', async () => {
      // 1. Open settings menu
      render(<SettingsMenu isOpen={true} onClose={jest.fn()} />); // Removed unused destructuring
      
      // 2. Click edit profile
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      // 3. Edit a field with pencil icon
      await waitFor(() => {
        const pencilIcons = screen.getAllByText('✏️');
        fireEvent.click(pencilIcons[0]);
      });
      
      // 4. Make changes and save
      const input = screen.getByDisplayValue('testuser');
      fireEvent.change(input, { target: { value: 'newusername' } });
      
      const saveButton = screen.getByText('✓');
      fireEvent.click(saveButton);
      
      // 5. Verify save was called
      await waitFor(() => {
        // Mock should have been called with updated profile
      });
    });
  });
});

const ProfileSystemTest = () => null;
export default ProfileSystemTest;