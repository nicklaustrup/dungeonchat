import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from './test-utils';
import ChatMessage from '../components/ChatRoom/ChatMessage';

// Mock Firebase and other dependencies
jest.mock('../components/ChatInput/EmojiMenu', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('../services/PresenceContext', () => ({ usePresence: () => ({ state: 'online', lastSeen: Date.now() }) }));

// Create a mock that tracks actual function calls
const mockToggleReaction = jest.fn(async (emoji) => {
  console.log('toggleReaction called with:', emoji);
  return Promise.resolve();
});

jest.mock('../hooks/useReactions', () => ({
  useReactions: () => ({
    reactions: {},
    toggleReaction: mockToggleReaction
  })
}));

jest.mock('../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'current_user', email: 'test@example.com' } },
    firestore: {},
    rtdb: null
  })
}));

jest.mock('../utils/avatar', () => ({ getFallbackAvatar: () => 'data:image/png;base64,fallback' }));

// Mock media queries for proper desktop vs mobile testing
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

describe('Reaction Function Call Bugs', () => {
  beforeEach(() => {
    mockToggleReaction.mockClear();
  });

  test('DESKTOP BUG: Message options menu reactions should call toggleReaction', async () => {
    mockMatchMedia(true); // Desktop environment
    
    const message = { 
      id: 'desktop_bug_test', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    let hoveredMessageId = null;
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => { hoveredMessageId = id; }}
      />
    );
    
    // Trigger hover to show reaction bar
    hoveredMessageId = message.id;
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => { hoveredMessageId = id; }}
      />
    );
    
    // Click options menu
    const menuTrigger = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuTrigger);
    
    await screen.findByTestId('message-options-menu');
    
    // Click quick reaction in menu (menu-reaction-btn class)
    const menuReactionBtns = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('menu-reaction-btn')
    );
    
    console.log('Found menu reaction buttons:', menuReactionBtns.length);
    const thumbsBtn = menuReactionBtns.find(btn => btn.textContent.includes('👍'));
    
    console.log('Before menu reaction click - calls:', mockToggleReaction.mock.calls.length);
    fireEvent.click(thumbsBtn);
    
    // Give it time to process
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log('After menu reaction click - calls:', mockToggleReaction.mock.calls);
    
    // This test will show if the bug exists
    expect(mockToggleReaction).toHaveBeenCalledWith('👍');
    expect(mockToggleReaction.mock.calls.length).toBe(1);
  });

  test('MOBILE BUG: Reaction buttons should call toggleReaction on mobile', async () => {
    mockMatchMedia(false); // Mobile environment
    
    const message = { 
      id: 'mobile_bug_test', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    let selectedMessageId = null;
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={(id) => { selectedMessageId = id; }}
      />
    );
    
    // Select message to show reactions on mobile
    selectedMessageId = message.id;
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={(id) => { selectedMessageId = id; }}
      />
    );
    
    // Click reaction button directly (reaction-btn class)
    const reactionBtns = screen.getAllByTestId('reaction-btn');
    const heartBtn = reactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    console.log('Before mobile reaction click - calls:', mockToggleReaction.mock.calls.length);
    
    // Simulate mobile touch interaction
    fireEvent.pointerDown(heartBtn, { pointerType: 'touch' });
    fireEvent.pointerUp(heartBtn, { pointerType: 'touch' });
    
    // Give time to process async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log('After mobile reaction click - calls:', mockToggleReaction.mock.calls);
    
    // This test will show if the mobile bug exists
    expect(mockToggleReaction).toHaveBeenCalledWith('❤️');
    expect(mockToggleReaction.mock.calls.length).toBe(1);
  });
  
  test('Compare desktop hover bar vs menu reactions', async () => {
    mockMatchMedia(true); // Desktop
    
    const message = { 
      id: 'comparison_test', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} 
    };
    
    let hoveredMessageId = null;
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => { hoveredMessageId = id; }}
      />
    );
    
    // Trigger hover
    hoveredMessageId = message.id;
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => { hoveredMessageId = id; }}
      />
    );
    
    // Test 1: Direct hover bar reaction
    const hoverReactionBtns = screen.getAllByTestId('reaction-btn');
    const hoverThumbsBtn = hoverReactionBtns.find(btn => btn.textContent.includes('👍'));
    
    console.log('Testing hover bar reaction...');
    fireEvent.click(hoverThumbsBtn);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const hoverBarCalls = mockToggleReaction.mock.calls.length;
    console.log('Hover bar calls:', hoverBarCalls);
    
    mockToggleReaction.mockClear();
    
    // Test 2: Menu reaction
    const menuTrigger = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuTrigger);
    
    await screen.findByTestId('message-options-menu');
    
    const menuReactionBtns = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('menu-reaction-btn')
    );
    const menuHeartBtn = menuReactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    console.log('Testing menu reaction...');
    fireEvent.click(menuHeartBtn);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const menuCalls = mockToggleReaction.mock.calls.length;
    console.log('Menu calls:', menuCalls);
    
    // Both should work
    expect(hoverBarCalls).toBe(1);
    expect(menuCalls).toBe(1);
  });
});