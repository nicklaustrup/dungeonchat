import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatMessage from '../components/ChatRoom/ChatMessage';

jest.mock('../components/ChatInput/EmojiMenu', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('../services/PresenceContext', () => ({ usePresence: () => ({ state: 'online', lastSeen: Date.now() }) }));
jest.mock('../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'current', email: 'c@example.com' } },
    firestore: {},
    rtdb: null
  })
}));
jest.mock('../utils/avatar', () => ({ getFallbackAvatar: () => 'data:image/png;base64,fallback' }));
jest.mock('firebase/firestore', () => ({ doc: () => ({}), updateDoc: async () => {} }));

describe('ChatMessage reactions integration', () => {
  test('adding a reaction shows reaction list', () => {
    const message = { id: 'rx1', uid: 'other', text: 'Hello', createdAt: new Date(), displayName: 'Other User', reactions: {} };
    render(<ChatMessage message={message} showMeta={true} />);
    const btn = screen.getAllByTestId('reaction-btn')[0];
    fireEvent.click(btn);
    const list = screen.getByTestId('reaction-list');
    expect(list).toBeInTheDocument();
  });
});
