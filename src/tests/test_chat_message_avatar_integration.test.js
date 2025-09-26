import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessage from '../components/ChatRoom/ChatMessage';

// Mock EmojiMenu to avoid side-effects
jest.mock('../components/ChatInput/EmojiMenu', () => ({
  __esModule: true,
  default: { open: jest.fn() }
}));

// Mock presence hook
jest.mock('../services/PresenceContext', () => ({
  usePresence: () => ({ state: 'online', lastSeen: Date.now() })
}));

// Mock Firebase context
jest.mock('../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'u1', email: 'u1@example.com' } },
    firestore: {},
    rtdb: null
  })
}));

// Mock avatar util to avoid randomness
jest.mock('../utils/avatar', () => ({
  getFallbackAvatar: jest.fn().mockReturnValue('data:image/png;base64,fallback2')
}));

describe('ChatMessage integration (avatar extraction)', () => {
  test('renders avatar component when showMeta is true', () => {
    const message = {
      id: 'm1',
      uid: 'u1',
      text: 'Hello world',
      createdAt: new Date(),
      displayName: 'User One'
    };
    render(<ChatMessage message={message} showMeta={true} />);
    expect(screen.getByTestId('avatar-with-presence')).toBeInTheDocument();
  });
});
