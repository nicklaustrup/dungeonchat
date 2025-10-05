import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InlineReplyContext from '../parts/InlineReplyContext';

// Mock dependencies
jest.mock('../../../services/cache', () => ({
  useCachedUserProfileData: jest.fn(),
  useCachedUserProfile: jest.fn()
}));

jest.mock('../../../services/FirebaseContext', () => ({
  useFirebase: jest.fn()
}));

jest.mock('../../../contexts/ProfanityFilterContext', () => ({
  useProfanityFilterContext: jest.fn()
}));

jest.mock('../../../utils/avatar', () => ({
  getFallbackAvatar: jest.fn(() => 'fallback-avatar-url')
}));

jest.mock('../../../utils/profanityFilter', () => ({
  useProfanityFilter: jest.fn(text => text)
}));

// Import the mocked functions
import { useCachedUserProfileData, useCachedUserProfile } from '../../../services/cache';
import { useFirebase } from '../../../services/FirebaseContext';
import { useProfanityFilterContext } from '../../../contexts/ProfanityFilterContext';
import { getFallbackAvatar } from '../../../utils/avatar';

describe('InlineReplyContext Profile Click', () => {
  const mockReplyTo = {
    id: 'reply-message-id',
    uid: 'replied-to-user-id',
    displayName: 'Replied To User',
    text: 'This is the original message being replied to',
    type: 'text',
    photoURL: 'replied-to-user-photo.jpg'
  };

  const mockCurrentUser = {
    uid: 'current-user-id'
  };

  const mockRepliedToProfile = {
    displayName: 'Enhanced Replied To User',
    username: 'repliedtouser',
    profilePictureURL: 'enhanced-replied-to-photo.jpg',
    bio: 'Bio of the replied to user',
    statusMessage: 'Status of replied to user'
  };

  beforeEach(() => {
    // Mock hooks
    useFirebase.mockReturnValue({
      user: mockCurrentUser
    });

    useProfanityFilterContext.mockReturnValue({
      profanityFilterEnabled: false
    });

    useCachedUserProfile.mockReturnValue({
      profile: null // Current user profile not relevant for this test
    });

    useCachedUserProfileData.mockReturnValue({
      profileData: mockRepliedToProfile
    });

    // Ensure getFallbackAvatar mock is working
    getFallbackAvatar.mockReturnValue('fallback-avatar-url');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should pass correct replied-to user data when profile is clicked', () => {
    const mockOnViewProfile = jest.fn();
    const mockOnNavigate = jest.fn();

    render(
      <InlineReplyContext
        replyTo={mockReplyTo}
        onViewProfile={mockOnViewProfile}
        onNavigate={mockOnNavigate}
      />
    );

    // Find and click the avatar
    const avatar = screen.getByTestId('irc-avatar');
    fireEvent.click(avatar);

    // Verify onViewProfile was called with the REPLIED-TO user's data, not the current message author
    expect(mockOnViewProfile).toHaveBeenCalledTimes(1);
    expect(mockOnViewProfile).toHaveBeenCalledWith({
      uid: 'replied-to-user-id', // Should be the replied-to user's UID, not the current message author
      displayName: 'Enhanced Replied To User',
      photoURL: 'enhanced-replied-to-photo.jpg',
      username: 'repliedtouser',
      bio: 'Bio of the replied to user',
      statusMessage: 'Status of replied to user'
    });
  });

  test('should pass correct replied-to user data when name is clicked', () => {
    const mockOnViewProfile = jest.fn();
    const mockOnNavigate = jest.fn();

    render(
      <InlineReplyContext
        replyTo={mockReplyTo}
        onViewProfile={mockOnViewProfile}
        onNavigate={mockOnNavigate}
      />
    );

    // Find and click the name button
    const nameButton = screen.getByTestId('irc-name-btn');
    fireEvent.click(nameButton);

    // Verify onViewProfile was called with the REPLIED-TO user's data
    expect(mockOnViewProfile).toHaveBeenCalledTimes(1);
    expect(mockOnViewProfile).toHaveBeenCalledWith({
      uid: 'replied-to-user-id', // Should be the replied-to user's UID
      displayName: 'Enhanced Replied To User',
      photoURL: 'enhanced-replied-to-photo.jpg',
      username: 'repliedtouser',
      bio: 'Bio of the replied to user',
      statusMessage: 'Status of replied to user'
    });
  });

  test('should use fallback avatar when profile picture is placeholder', () => {
    const mockOnViewProfile = jest.fn();
    const mockOnNavigate = jest.fn();
    
    // Mock a profile with placeholder URL
    useCachedUserProfileData.mockReturnValue({
      profileData: {
        ...mockRepliedToProfile,
        profilePictureURL: 'https://via.placeholder.com/150'
      }
    });

    render(
      <InlineReplyContext
        replyTo={mockReplyTo}
        onViewProfile={mockOnViewProfile}
        onNavigate={mockOnNavigate}
      />
    );

    const avatar = screen.getByTestId('irc-avatar');
    fireEvent.click(avatar);

    // Should use the original photoURL from replyTo since profile URL is placeholder
    expect(mockOnViewProfile).toHaveBeenCalledWith({
      uid: 'replied-to-user-id',
      displayName: 'Enhanced Replied To User',
      photoURL: 'replied-to-user-photo.jpg', // Should fall back to replyTo.photoURL
      username: 'repliedtouser',
      bio: 'Bio of the replied to user',
      statusMessage: 'Status of replied to user'
    });
  });

  test('should use fallback avatar when both profile and replyTo photos are placeholders', () => {
    const mockOnViewProfile = jest.fn();
    const mockOnNavigate = jest.fn();
    
    // Mock a profile with placeholder URL
    useCachedUserProfileData.mockReturnValue({
      profileData: {
        ...mockRepliedToProfile,
        profilePictureURL: 'https://via.placeholder.com/150'
      }
    });

    const replyToWithPlaceholder = {
      ...mockReplyTo,
      photoURL: 'https://via.placeholder.com/100'
    };

    render(
      <InlineReplyContext
        replyTo={replyToWithPlaceholder}
        onViewProfile={mockOnViewProfile}
        onNavigate={mockOnNavigate}
      />
    );

    const avatar = screen.getByTestId('irc-avatar');
    fireEvent.click(avatar);

    // Should use fallback avatar when both are placeholders
    expect(mockOnViewProfile).toHaveBeenCalledWith({
      uid: 'replied-to-user-id',
      displayName: 'Enhanced Replied To User',
      photoURL: 'fallback-avatar-url',
      username: 'repliedtouser',
      bio: 'Bio of the replied to user',
      statusMessage: 'Status of replied to user'
    });
  });
});