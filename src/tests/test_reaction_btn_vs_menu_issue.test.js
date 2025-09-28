import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatMessage from '../components/ChatRoom/ChatMessage';

// Mock Firebase and other dependencies
jest.mock('../components/ChatInput/EmojiMenu', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('../services/PresenceContext', () => ({ usePresence: () => ({ state: 'online', lastSeen: Date.now() }) }));

jest.mock('firebase/firestore', () => {
  const mockUpdateDoc = jest.fn(async () => {});
  const mockDeleteField = jest.fn(() => Symbol('DELETE_FIELD'));
  return { 
    doc: () => ({ path: 'messages/test' }), 
    updateDoc: mockUpdateDoc,
    deleteField: mockDeleteField
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

describe('Reaction Button vs Menu Issue Investigation', () => {
  let mockUpdateDoc;

  beforeEach(() => {
    const firebase = require('firebase/firestore');
    mockUpdateDoc = firebase.updateDoc;
    mockUpdateDoc.mockClear();
    
    // Mock desktop environment
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('hover: none') && query.includes('pointer: coarse') ? false : true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  });

  test('INVESTIGATION: Direct reaction-btn vs menu-reaction-btn behavior', async () => {
    const message = { 
      id: 'test_reaction_investigation', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    // Setup hover state
    let hoveredMessageId = null;
    const handleHoverMessage = (messageId) => {
      hoveredMessageId = messageId;
    };
    
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );
    
    // Hover to show reaction bar
    const messageEl = screen.getByRole('article');
    fireEvent.mouseEnter(messageEl);
    
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );
    
    // Test 1: Click reaction-btn directly from hover bar
    console.log('=== Testing direct reaction-btn ===');
    const directReactionBtns = screen.getAllByTestId('reaction-btn');
    const directThumbsBtn = directReactionBtns.find(btn => btn.textContent.includes('👍'));
    
    fireEvent.click(directThumbsBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('reaction-item')).toHaveTextContent('👍 1');
    });
    
    console.log('Direct reaction-btn calls:', mockUpdateDoc.mock.calls);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.👍': ['current_user'] }
    );
    
    mockUpdateDoc.mockClear();
    
    // Test 2: Click menu-reaction-btn from options menu
    console.log('=== Testing menu-reaction-btn ===');
    const menuTrigger = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuTrigger);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-options-menu')).toBeInTheDocument();
    });
    
    const menuReactionBtns = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('menu-reaction-btn')
    );
    const menuHeartBtn = menuReactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    // This should fail if parameter passing is wrong
    fireEvent.click(menuHeartBtn);
    
    console.log('Menu reaction-btn calls:', mockUpdateDoc.mock.calls);
    
    // Check if the reaction was actually added
    try {
      await waitFor(() => {
        const reactionItems = screen.getAllByTestId('reaction-item');
        const heartReaction = reactionItems.find(item => item.textContent.includes('❤️'));
        expect(heartReaction).toHaveTextContent('❤️ 1');
      }, { timeout: 3000 });
      
      console.log('✅ Menu reaction successfully added');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: 'messages/test' },
        { 'reactions.❤️': ['current_user'] }
      );
    } catch (error) {
      console.log('❌ Menu reaction failed to add:', error.message);
      console.log('UpdateDoc was called with:', mockUpdateDoc.mock.calls);
      
      // Check what actually got passed to the function
      if (mockUpdateDoc.mock.calls.length > 0) {
        console.log('Parameter analysis:', mockUpdateDoc.mock.calls[0][1]);
      }
      
      throw error;
    }
  });
});