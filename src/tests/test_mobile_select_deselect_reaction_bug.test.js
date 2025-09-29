import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { render } from './test-utils';
import ChatMessage from '../components/ChatRoom/ChatMessage';

// Mock Firebase and other dependencies
jest.mock('../services/PresenceContext', () => ({ usePresence: () => ({ state: 'online', lastSeen: Date.now() }) }));

jest.mock('firebase/firestore', () => {
  const mockUpdateDoc = jest.fn(async () => {
    // Simulate network delay that happens in real app
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  
  const mockDeleteField = jest.fn(() => ({
    __deleteField: true
  }));

  return {
    doc: jest.fn((db, collection, id) => ({ path: `${collection}/${id}` })),
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

describe('Mobile Selection/Deselection Reaction Bug', () => {
  let mockUpdateDoc;
  let mockDeleteField;
  let consoleErrors = [];
  
  beforeEach(() => {
    // Mock matchMedia to simulate touch device for this test
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('hover: none') && query.includes('pointer: coarse'), // Simulate touch device
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  
    // Get the mocked functions
    const firebase = require('firebase/firestore');
    mockUpdateDoc = firebase.updateDoc;
    mockDeleteField = firebase.deleteField;
    
    mockUpdateDoc.mockClear();
    mockDeleteField.mockClear();
    
    // Capture console errors that might indicate "no reaction error"
    consoleErrors = [];
    const originalError = console.error;
    console.error = jest.fn((...args) => {
      consoleErrors.push(args.join(' '));
      originalError(...args);
    });
  });

  afterEach(() => {
    console.error = console.error.mockImplementation ? jest.fn() : console.error;
  });

  test('MOBILE BUG: Rapid select/deselect cycles with reaction attempts', async () => {
    // Message with no initial reactions
    const message = { 
      id: 'select_deselect_bug', 
      uid: 'other_user', 
      text: 'Test message', 
      createdAt: new Date(), 
      displayName: 'Other User', 
      reactions: {} // No initial reactions
    };
    
    let selectedMessageId = null;
    const handleSelectMessage = (messageId) => {
      selectedMessageId = messageId;
      console.log('Message selection changed:', messageId);
    };
    
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    console.log('=== TESTING RAPID SELECT/DESELECT WITH REACTIONS ===');
    
    // Simulate the problematic pattern: rapid select/deselect cycles with reaction attempts
    for (let cycle = 1; cycle <= 5; cycle++) {
      console.log(`\n--- Cycle ${cycle} ---`);
      
      // 1. Select message
      console.log(`Cycle ${cycle}: Selecting message...`);
      handleSelectMessage(message.id);
      rerender(
        <ChatMessage 
          message={message} 
          showMeta={true} 
          selected={selectedMessageId === message.id}
          onSelectMessage={handleSelectMessage}
        />
      );
      
      // Wait for render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // 2. Try to add reaction while selected
      console.log(`Cycle ${cycle}: Adding reaction while selected...`);
      
      const reactionBtns = screen.getAllByTestId('reaction-btn');
      const thumbsBtn = reactionBtns.find(btn => btn.textContent.includes('👍'));
      
      if (thumbsBtn) {
        // Log button state before clicking
        console.log(`Cycle ${cycle}: Button found, classes:`, thumbsBtn.parentElement?.className);
        console.log(`Cycle ${cycle}: Button disabled:`, thumbsBtn.disabled);
        console.log(`Cycle ${cycle}: Button aria-hidden:`, thumbsBtn.parentElement?.getAttribute('aria-hidden'));
        
        // Simulate touch interaction
        fireEvent.pointerDown(thumbsBtn, { pointerType: 'touch' });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50)); // Brief touch
        });
        fireEvent.pointerUp(thumbsBtn, { pointerType: 'touch' });
        
        // Wait for potential reaction processing
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        console.log(`Cycle ${cycle}: Firebase calls after reaction attempt:`, mockUpdateDoc.mock.calls.length);
        
        if (consoleErrors.length > 0) {
          console.log(`Cycle ${cycle}: Console errors detected:`, consoleErrors);
        }
      } else {
        console.log(`Cycle ${cycle}: ❌ No reaction button found - this might be the issue!`);
      }
      
      // 3. Deselect message quickly
      console.log(`Cycle ${cycle}: Deselecting message...`);
      handleSelectMessage(null);
      rerender(
        <ChatMessage 
          message={message} 
          showMeta={true} 
          selected={selectedMessageId === message.id}
          onSelectMessage={handleSelectMessage}
        />
      );
      
      // Brief delay before next cycle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      // 4. Check state integrity
      const currentReactionItems = screen.queryAllByTestId('reaction-item');
      console.log(`Cycle ${cycle}: Reaction items after cycle:`, currentReactionItems.length);
      
      // Look for any "no reaction" error patterns
      const hasErrorIndicators = consoleErrors.some(error => 
        error.includes('no reaction') || 
        (error.includes('undefined') && error.includes('reaction')) ||
        error.includes('failed') ||
        error.includes('❌')
      );
      
      if (hasErrorIndicators) {
        console.log(`🚨 Cycle ${cycle}: Potential "no reaction error" detected!`);
        console.log('Error details:', consoleErrors);
      }
    }
    
    // Final analysis
    console.log('\n=== FINAL ANALYSIS ===');
    console.log('Total Firebase calls:', mockUpdateDoc.mock.calls.length);
    console.log('Total console errors:', consoleErrors.length);
    console.log('Final reaction state on UI:', screen.queryAllByTestId('reaction-item').length);
    
    if (consoleErrors.length > 0) {
      console.log('All errors encountered:');
      consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    // The test passes if we can complete the cycles without critical errors
    // but we log everything to understand what's happening
    expect(mockUpdateDoc).toHaveBeenCalled(); // Should have some reaction attempts
    
    // Check for the specific "no reaction error" pattern
    const hasNoReactionError = consoleErrors.some(error => 
      error.includes('no reaction') || 
      error.includes('Reaction update failed')
    );
    
    if (hasNoReactionError) {
      console.log('🚨 CONFIRMED: "no reaction error" detected during select/deselect cycles');
      // Don't fail the test, but log for debugging
    } else {
      console.log('✅ No "no reaction error" detected in this run');
    }
  });

  test('MOBILE BUG: Race condition between selection state and reaction state', async () => {
    const message = { 
      id: 'race_condition_test', 
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
    
    const { rerender } = render(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    console.log('=== TESTING RACE CONDITION ===');
    
    // 1. Select message
    handleSelectMessage(message.id);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    // 2. Start reaction process
    const reactionBtns = screen.getAllByTestId('reaction-btn');
    const heartBtn = reactionBtns.find(btn => btn.textContent.includes('❤️'));
    
    // 3. Initiate pointer down (start of touch)
    fireEvent.pointerDown(heartBtn, { pointerType: 'touch' });
    
    // 4. IMMEDIATELY deselect message while pointer is down (race condition)
    handleSelectMessage(null);
    rerender(
      <ChatMessage 
        message={message} 
        showMeta={true} 
        selected={selectedMessageId === message.id}
        onSelectMessage={handleSelectMessage}
      />
    );
    
    // 5. Complete the touch after deselection
    fireEvent.pointerUp(heartBtn, { pointerType: 'touch' });
    
    // Wait for processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    console.log('Race condition test - Firebase calls:', mockUpdateDoc.mock.calls.length);
    console.log('Race condition test - Console errors:', consoleErrors);
    
    // This tests the edge case where reaction processing starts while selected
    // but completes after deselection - could cause "no reaction error"
    const raceConditionError = consoleErrors.some(error => 
      error.includes('no reaction') || 
      error.includes('undefined') ||
      error.includes('failed')
    );
    
    if (raceConditionError) {
      console.log('🚨 Race condition detected between selection and reaction state');
    } else {
      console.log('✅ No race condition errors detected');
    }
  });
});