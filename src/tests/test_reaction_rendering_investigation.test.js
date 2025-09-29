import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from './test-utils'; // Use our custom render with providers
import ChatMessage from '../components/ChatRoom/ChatMessage';

// Mock Firebase
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

jest.mock('../services/PresenceContext', () => ({ usePresence: () => ({ state: 'online', lastSeen: Date.now() }) }));
jest.mock('../components/ChatInput/EmojiMenu', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('../utils/avatar', () => ({ getFallbackAvatar: () => 'data:image/png;base64,fallback' }));

describe('Reaction Rendering vs Adding Investigation', () => {
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

  test('DETAILED: Reaction-btn adds but may not render in certain states', async () => {
    // Start with a message that already has some reactions
    const message = { 
      id: 'test_render_issue', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {
        '👍': ['some_other_user'],
        '❤️': [] // Empty reaction array - this should be filtered out
      }
    };
    
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
    
    // Check initial render - empty reactions should be filtered
    expect(screen.queryByText('❤️ 0')).not.toBeInTheDocument();
    expect(screen.getByText('👍 1')).toBeInTheDocument();
    
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
    
    // Click direct reaction button to add a heart reaction
    console.log('=== Testing reaction-btn with existing reactions ===');
    const reactionBtns = screen.getAllByTestId('reaction-btn');
    const heartBtn = reactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    fireEvent.click(heartBtn);
    
    // Verify the Firebase call
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: 'messages/test' },
        { 'reactions.❤️': ['current_user'] }
      );
    });
    
    console.log('UpdateDoc call successful:', mockUpdateDoc.mock.calls[0]);
    
    // Now verify the UI updates correctly
    await waitFor(() => {
      expect(screen.getByText('❤️ 1')).toBeInTheDocument();
    });
    
    console.log('✅ Reaction button successfully added and rendered reaction');
    
    mockUpdateDoc.mockClear();
    
    // Test again with menu reaction
    console.log('=== Testing menu-reaction-btn with existing reactions ===');
    const menuTrigger = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuTrigger);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-options-menu')).toBeInTheDocument();
    });
    
    // Click on thumbs up in menu (should increment existing reaction)
    const menuReactionBtns = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('menu-reaction-btn')
    );
    const menuThumbsBtn = menuReactionBtns.find(btn => btn.textContent.includes('👍'));
    
    fireEvent.click(menuThumbsBtn);
    
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: 'messages/test' },
        { 'reactions.👍': ['some_other_user', 'current_user'] }
      );
    });
    
    console.log('Menu reaction call successful:', mockUpdateDoc.mock.calls[0]);
    
    // Verify UI shows updated count
    await waitFor(() => {
      expect(screen.getByText('👍 2')).toBeInTheDocument();
    });
    
    console.log('✅ Menu reaction successfully added and rendered');
  });

  test('EDGE CASE: Test with message that has no reactions initially', async () => {
    const message = { 
      id: 'test_no_reactions', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} // No reactions initially
    };
    
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
    
    // Should show no reactions initially
    expect(screen.queryByTestId('reaction-item')).not.toBeInTheDocument();
    
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
    
    // Click reaction button
    const reactionBtns = screen.getAllByTestId('reaction-btn');
    const laughBtn = reactionBtns.find(btn => btn.textContent.includes('😂'));
    
    console.log('=== Testing reaction-btn on message with no initial reactions ===');
    fireEvent.click(laughBtn);
    
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: 'messages/test' },
        { 'reactions.😂': ['current_user'] }
      );
    });
    
    // Verify new reaction appears
    await waitFor(() => {
      expect(screen.getByTestId('reaction-item')).toHaveTextContent('😂 1');
    });
    
    console.log('✅ Reaction successfully added to message with no initial reactions');
  });
});