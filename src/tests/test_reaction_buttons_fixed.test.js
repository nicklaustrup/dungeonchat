import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from './test-utils';
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

describe('FIXED: Direct Reaction Buttons Pointer Event Fix', () => {
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

  test('FIXED: reaction-buttons work correctly with mouse pointer events', async () => {
    const message = { 
      id: 'test_fixed_mouse', 
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
    
    // Hover to show reaction bar
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );
    
    const directReactionBtns = screen.getAllByTestId('reaction-btn');
    const thumbsBtn = directReactionBtns.find(btn => btn.textContent.includes('👍'));
    
    console.log('=== TESTING FIXED MOUSE INTERACTION ===');
    
    // Simulate real mouse interaction with both pointer events and click
    fireEvent.pointerDown(thumbsBtn, { pointerType: 'mouse' });
    fireEvent.click(thumbsBtn); // This should be the primary trigger for mouse
    fireEvent.pointerUp(thumbsBtn, { pointerType: 'mouse' });
    
    // Should only be called once (from click, not from pointer events)
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.👍': ['current_user'] }
    );
    
    console.log('✅ Mouse interaction now correctly calls Firebase once');
    console.log('Firebase call:', mockUpdateDoc.mock.calls[0]);
  });

  test('FIXED: reaction-buttons still work with touch devices', async () => {
    const message = { 
      id: 'test_fixed_touch', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {}
    };
    
    let selectedMessageId = null;
    const handleSelectMessage = (messageId) => {
      selectedMessageId = messageId;
    };
    
    // Mock mobile environment
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('hover: none') && query.includes('pointer: coarse') ? true : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
    
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    // Select message to show reactions on mobile
    handleSelectMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    const directReactionBtns = screen.getAllByTestId('reaction-btn');
    const heartBtn = directReactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    console.log('=== TESTING FIXED TOUCH INTERACTION ===');
    
    // Simulate touch interaction (should work via pointer events since it's not mouse)
    fireEvent.pointerDown(heartBtn, { pointerType: 'touch' });
    
    // Wait less than long press timeout
    await new Promise(resolve => setTimeout(resolve, 200));
    
    fireEvent.pointerUp(heartBtn, { pointerType: 'touch' });
    
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.❤️': ['current_user'] }
    );
    
    console.log('✅ Touch interaction works correctly');
    console.log('Firebase call:', mockUpdateDoc.mock.calls[0]);
  });

  test('COMPREHENSIVE: Both reaction-buttons and message-menu work correctly', async () => {
    const message = { 
      id: 'test_comprehensive', 
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
    
    // Test direct reaction button
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );
    
    console.log('=== COMPREHENSIVE TEST ===');
    console.log('Testing direct reaction-buttons...');
    
    const directReactionBtns = screen.getAllByTestId('reaction-btn');
    const directThumbsBtn = directReactionBtns.find(btn => btn.textContent.includes('👍'));
    
    // Real mouse click
    fireEvent.click(directThumbsBtn);
    
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.👍': ['current_user'] }
    );
    
    console.log('✅ Direct reaction-buttons working');
    
    mockUpdateDoc.mockClear();
    
    // Test menu reaction button
    console.log('Testing message-menu reactions...');
    
    const menuTrigger = screen.getByRole('button', { name: /options/i });
    fireEvent.click(menuTrigger);
    
    await waitFor(() => {
      expect(screen.getByTestId('message-options-menu')).toBeInTheDocument();
    });
    
    const menuReactionBtns = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('menu-reaction-btn')
    );
    const menuHeartBtn = menuReactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    fireEvent.click(menuHeartBtn);
    
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });
    
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'messages/test' },
      { 'reactions.❤️': ['current_user'] }
    );
    
    console.log('✅ Menu reactions working');
    console.log('🎉 BOTH reaction methods now work correctly!');
  });
});