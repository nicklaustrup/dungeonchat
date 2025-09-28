import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatMessage from '../components/ChatRoom/ChatMessage';

// Mock Firebase and other dependencies
jest.mock('../components/ChatInput/EmojiMenu', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('../services/PresenceContext', () => ({ usePresence: () => ({ state: 'online', lastSeen: Date.now() }) }));

jest.mock('firebase/firestore', () => {
  const mockUpdateDoc = jest.fn(async () => {});
  return { 
    doc: () => ({ path: 'messages/test' }), 
    updateDoc: mockUpdateDoc 
  };
});

jest.mock('../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'current_user', email: 'test@example.com' } },
    firestore: {},
    rtdb: null
  })
}));

jest.mock('../utils/avatar', () => ({ getFallbackAvatar: () => 'data:image/png;base64,fallback' }));

describe('ReactionBar Bug - Shows 0 instead of 1', () => {
  let mockUpdateDoc;

  beforeEach(() => {
    // Access the mocked updateDoc function
    const firebase = require('firebase/firestore');
    mockUpdateDoc = firebase.updateDoc;
    mockUpdateDoc.mockClear();
  });

  test('clicking reaction bar button should show count 1, not 0', async () => {
    // Create a message with no initial reactions
    const message = { 
      id: 'test_message', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    render(<ChatMessage message={message} showMeta={true} />);
    
    // Find and click the first reaction button (👍) in the hover bar
    const reactionBtns = screen.getAllByTestId('reaction-btn');
    const thumbsUpBtn = reactionBtns.find(btn => btn.textContent === '👍');
    
    expect(thumbsUpBtn).toBeInTheDocument();
    
    // Click the reaction button
    fireEvent.click(thumbsUpBtn);
    
    // Wait for the reaction list to appear
    await waitFor(() => {
      const reactionList = screen.getByTestId('reaction-list');
      expect(reactionList).toBeInTheDocument();
    });
    
    // Check that the reaction shows count 1, not 0
    const reactionItem = screen.getByTestId('reaction-item');
    expect(reactionItem).toHaveTextContent('👍 1');
    expect(reactionItem).not.toHaveTextContent('👍 0');
    
    // Verify the Firestore update was called with correct data
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.👍': ['current_user'] }
    );
  });

  test('reaction list correctly handles array-based reaction data', () => {
    // Message with existing reactions in correct array format
    const message = { 
      id: 'test_message2', 
      uid: 'other_user', 
      text: 'Test message with reactions', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {
        '👍': ['user1', 'user2'],
        '❤️': ['user1']
      }
    };
    
    render(<ChatMessage message={message} showMeta={true} />);
    
    // Check that existing reactions display correct counts
    const reactionItems = screen.getAllByTestId('reaction-item');
    
    const thumbsUpReaction = reactionItems.find(item => item.textContent.includes('👍'));
    const heartReaction = reactionItems.find(item => item.textContent.includes('❤️'));
    
    expect(thumbsUpReaction).toHaveTextContent('👍 2');
    expect(heartReaction).toHaveTextContent('❤️ 1');
  });
  
  test('reaction list handles empty array correctly', () => {
    // Message with empty reaction arrays (edge case)
    const message = { 
      id: 'test_message3', 
      uid: 'other_user', 
      text: 'Test message with empty arrays', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {
        '👍': []
      }
    };
    
    render(<ChatMessage message={message} showMeta={true} />);
    
    // No reaction list should be visible since there are no actual reactions
    const reactionList = screen.queryByTestId('reaction-list');
    expect(reactionList).not.toBeInTheDocument();
  });
});