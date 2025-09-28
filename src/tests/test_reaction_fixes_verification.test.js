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

// Mock media queries for desktop vs mobile testing
const mockMatchMedia = (isDesktop) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query.includes('hover: none') && query.includes('pointer: coarse') ? !isDesktop : isDesktop,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
};

describe('Fixed Reaction Bugs - Desktop and Mobile', () => {
  let mockUpdateDoc;

  beforeEach(() => {
    const firebase = require('firebase/firestore');
    mockUpdateDoc = firebase.updateDoc;
    mockUpdateDoc.mockClear();
  });

  test('FIXED: Desktop quick reactions in message options menu work correctly', async () => {
    mockMatchMedia(true); // Desktop environment
    
    const message = { 
      id: 'fixed_desktop_test', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    // Properly mock hover state
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
    
    // Trigger hover to show reaction bar
    const messageEl = screen.getByRole('article');
    fireEvent.mouseEnter(messageEl);
    
    // Update hover state
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );
    
    // Click options menu
    const menuTrigger = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuTrigger);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-options-menu')).toBeInTheDocument();
    });
    
    // Click quick reaction in menu (should work now with fixed parameter naming)
    const menuReactionBtns = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('menu-reaction-btn')
    );
    
    const thumbsBtn = menuReactionBtns.find(btn => btn.textContent.includes('👍'));
    expect(thumbsBtn).toBeInTheDocument();
    
    fireEvent.click(thumbsBtn);
    
    // Should successfully add reaction
    await waitFor(() => {
      const reactionItem = screen.getByTestId('reaction-item');
      expect(reactionItem).toHaveTextContent('👍 1');
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.👍': ['current_user'] }
    );
  });

  test('FIXED: Desktop hover reaction bar works with corrected CSS', async () => {
    mockMatchMedia(true); // Desktop environment
    
    const message = { 
      id: 'fixed_hover_test', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    // Mock hover state
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
    
    // Hover over message
    const messageEl = screen.getByRole('article');
    fireEvent.mouseEnter(messageEl);
    
    // Update hover state
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );
    
    // Reaction bar should be visible and clickable (no hidden-collapsed class or proper CSS override)
    const reactionBar = screen.getByTestId('reaction-bar');
    expect(reactionBar).not.toHaveAttribute('aria-hidden');
    
    // Click reaction button directly from hover bar
    const reactionBtns = screen.getAllByTestId('reaction-btn');
    const heartBtn = reactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    fireEvent.click(heartBtn);
    
    await waitFor(() => {
      const reactionItem = screen.getByTestId('reaction-item');
      expect(reactionItem).toHaveTextContent('❤️ 1');
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.❤️': ['current_user'] }
    );
  });

  test('FIXED: Mobile reaction buttons work with proper selection state', async () => {
    mockMatchMedia(false); // Mobile environment
    
    const message = { 
      id: 'fixed_mobile_test', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    // Mock selection state for mobile
    let selectedMessageId = null;
    const handleSelectMessage = (messageId) => {
      selectedMessageId = messageId;
    };
    
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    // On mobile, select message to show reactions
    const messageEl = screen.getByRole('article');
    fireEvent.click(messageEl);
    
    // Update selection state
    handleSelectMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    // Reaction buttons should be visible and clickable
    const reactionBar = screen.getByTestId('reaction-bar');
    expect(reactionBar).toBeInTheDocument();
    
    const reactionBtns = screen.getAllByTestId('reaction-btn');
    const laughBtn = reactionBtns.find(btn => btn.textContent.includes('😂'));
    
    // Click reaction button (should work with proper mobile interaction)
    fireEvent.click(laughBtn);
    
    await waitFor(() => {
      const reactionItem = screen.getByTestId('reaction-item');
      expect(reactionItem).toHaveTextContent('😂 1');
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.😂': ['current_user'] }
    );
  });

  test('VERIFIED: Both desktop hover and menu reactions work consistently', async () => {
    mockMatchMedia(true); // Desktop
    
    const message = { 
      id: 'consistency_test', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
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
    
    // Test hover bar reaction first
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );
    
    const hoverReactionBtns = screen.getAllByTestId('reaction-btn');
    const hoverThumbsBtn = hoverReactionBtns.find(btn => btn.textContent.includes('👍'));
    fireEvent.click(hoverThumbsBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('reaction-item')).toHaveTextContent('👍 1');
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    mockUpdateDoc.mockClear();
    
    // Test menu reaction
    const menuTrigger = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuTrigger);
    
    await screen.findByTestId('message-options-menu');
    
    const menuReactionBtns = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('menu-reaction-btn')
    );
    const menuHeartBtn = menuReactionBtns.find(btn => btn.textContent.includes('❤️'));
    fireEvent.click(menuHeartBtn);
    
    await waitFor(() => {
      const reactionItems = screen.getAllByTestId('reaction-item');
      expect(reactionItems).toHaveLength(2); // Both reactions should exist
    });
    
    const reactionItems = screen.getAllByTestId('reaction-item');
    expect(reactionItems.find(item => item.textContent.includes('❤️ 1'))).toBeInTheDocument();
    
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });
});