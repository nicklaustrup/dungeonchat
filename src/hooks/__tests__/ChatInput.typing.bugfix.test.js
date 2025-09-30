import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import ChatInput from '../../components/ChatInput/ChatInput';
import { useTypingPresence } from '../useTypingPresence';
import { ChatStateProvider } from '../../contexts/ChatStateContext';

// Mock dependencies
jest.mock('../../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'user1', displayName: 'Test User' } },
    firestore: {},
    rtdb: {},
    storage: {}
  })
}));

jest.mock('../../services/messageService', () => ({
  createTextMessage: jest.fn().mockResolvedValue()
}));

jest.mock('../../utils/sound', () => ({
  playSendMessageSound: jest.fn(),
  beginTypingLoop: jest.fn(),
  endTypingLoop: jest.fn()
}));

jest.mock('../../services/presenceService', () => ({
  setTyping: jest.fn(),
  refreshPresence: jest.fn()
}));

jest.mock('../../hooks/useImageMessage', () => ({
  useImageMessage: () => ({
    handleImageSelect: jest.fn(),
    sendImageMessage: jest.fn(),
    clearImage: jest.fn(),
    error: null
  })
}));

jest.mock('../../hooks/useEmojiPicker', () => ({
  useEmojiPicker: () => ({
    open: false,
    toggle: jest.fn(),
    buttonRef: { current: null },
    setOnSelect: jest.fn()
  })
}));

const { createTextMessage } = require('../../services/messageService');
const { setTyping } = require('../../services/presenceService');
const { endTypingLoop } = require('../../utils/sound');

describe('ChatInput & TypingPresence - Bug Fix Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Bug Fix: Typing Indicator Not Clearing on Send', () => {
    test('should clear typing indicator when message is sent via button', async () => {
      const forceScrollBottom = jest.fn();

      render(
        <ChatStateProvider>
          <ChatInput 
            getDisplayName={() => 'Test User'}
            soundEnabled={false}
            forceScrollBottom={forceScrollBottom}
          />
        </ChatStateProvider>
      );

      const textarea = screen.getByLabelText(/message text/i);
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Start typing
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      // Verify typing was set to true
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );

      // Send message
      await act(async () => {
        fireEvent.click(sendButton);
      });

      // Should clear typing indicator (setTyping called with false)
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );

      expect(createTextMessage).toHaveBeenCalled();
      expect(textarea.value).toBe(''); // Input should be cleared
    });

    test('should clear typing indicator when message is sent via Enter key', async () => {
      const forceScrollBottom = jest.fn();

      render(
        <ChatStateProvider>
          <ChatInput 
            getDisplayName={() => 'Test User'}
            soundEnabled={false}
            forceScrollBottom={forceScrollBottom}
          />
        </ChatStateProvider>
      );

      const textarea = screen.getByLabelText(/message text/i);

      // Start typing
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );

      // Send with Enter
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      });

      // Should clear typing indicator
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );

      expect(createTextMessage).toHaveBeenCalled();
    });

    test('should NOT send message with Shift+Enter but continue typing', async () => {
      render(
        <ChatStateProvider>
          <ChatInput 
            getDisplayName={() => 'Test User'}
            soundEnabled={false}
            forceScrollBottom={jest.fn()}
          />
        </ChatStateProvider>
      );

      const textarea = screen.getByLabelText(/message text/i);

      fireEvent.change(textarea, { target: { value: 'Line 1' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(createTextMessage).not.toHaveBeenCalled();
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );
    });
  });

  describe('Bug Fix: Typing Indicator Not Clearing on Text Clear', () => {
    test('should clear typing indicator when all text is removed', () => {
      const { result } = renderHook(() => 
        useTypingPresence({
          rtdb: {},
          user: { uid: 'user1', displayName: 'Test User' },
          soundEnabled: false
        })
      );

      // Start typing
      act(() => {
        result.current.handleInputActivity(5); // 5 characters
      });

      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );

      // Clear all text
      act(() => {
        result.current.handleInputActivity(0); // 0 characters
      });

      // Should immediately clear typing indicator
      expect(setTyping).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );

      expect(endTypingLoop).toHaveBeenCalled();
    });

    test('should clear typing indicator in ChatInput when text is cleared', async () => {
      render(
        <ChatStateProvider>
          <ChatInput 
            getDisplayName={() => 'Test User'}
            soundEnabled={false}
            forceScrollBottom={jest.fn()}
          />
        </ChatStateProvider>
      );

      const textarea = screen.getByLabelText(/message text/i);

      // Type some text
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );

      // Clear all text
      fireEvent.change(textarea, { target: { value: '' } });
      
      // Should clear typing indicator
      expect(setTyping).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );
    });
  });

  describe('Bug Fix: Typing Indicator Auto-Clear After Inactivity', () => {
    test('should auto-clear typing after 6 seconds of inactivity', () => {
      const { result } = renderHook(() => 
        useTypingPresence({
          rtdb: {},
          user: { uid: 'user1', displayName: 'Test User' },
          soundEnabled: false
        })
      );

      // Start typing
      act(() => {
        result.current.handleInputActivity(5);
      });

      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );

      // Fast forward 6 seconds
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      // Should auto-clear typing indicator
      expect(setTyping).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );

      expect(endTypingLoop).toHaveBeenCalled();
    });

    test('should reset timer on continued typing', () => {
      const { result } = renderHook(() => 
        useTypingPresence({
          rtdb: {},
          user: { uid: 'user1', displayName: 'Test User' },
          soundEnabled: false
        })
      );

      // Start typing
      act(() => {
        result.current.handleInputActivity(5);
      });

      // Continue typing after 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
        result.current.handleInputActivity(8); // More text
      });

      // Fast forward another 3 seconds (6 seconds total, but timer was reset)
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should still be typing (timer was reset)
      expect(setTyping).not.toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );

      // Fast forward the full 6 seconds from last activity
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Now should clear
      expect(setTyping).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle user being null gracefully', () => {
      const { result } = renderHook(() => 
        useTypingPresence({
          rtdb: {},
          user: null,
          soundEnabled: false
        })
      );

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.handleInputActivity(5);
        });
      }).not.toThrow();

      expect(setTyping).not.toHaveBeenCalled();
    });

    test('should handle rapid text changes correctly', () => {
      const { result } = renderHook(() => 
        useTypingPresence({
          rtdb: {},
          user: { uid: 'user1', displayName: 'Test User' },
          soundEnabled: false
        })
      );

      // Rapid changes
      act(() => {
        result.current.handleInputActivity(1);
        result.current.handleInputActivity(2);
        result.current.handleInputActivity(3);
        result.current.handleInputActivity(0); // Clear
        result.current.handleInputActivity(1);
      });

      // Should handle all changes without error
      // Due to redundant call avoidance, fewer calls are made: 1 -> true, 0 -> false, 1 -> true
      expect(setTyping).toHaveBeenCalledTimes(3);
      expect(setTyping).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );
    });

    test('should cleanup timers on unmount', () => {
      const { unmount } = renderHook(() => 
        useTypingPresence({
          rtdb: {},
          user: { uid: 'user1', displayName: 'Test User' },
          soundEnabled: true
        })
      );

      act(() => {
        unmount();
      });

      expect(endTypingLoop).toHaveBeenCalled();
    });
  });

  describe('Integration with ChatInput', () => {
    test('complete typing flow: type -> send -> clear', async () => {
      render(
        <ChatStateProvider>
          <ChatInput 
            getDisplayName={() => 'Test User'}
            soundEnabled={false}
            forceScrollBottom={jest.fn()}
          />
        </ChatStateProvider>
      );

      const textarea = screen.getByLabelText(/message text/i);
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // 1. Start typing
      fireEvent.change(textarea, { target: { value: 'H' } });
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );

      // 2. Continue typing
      fireEvent.change(textarea, { target: { value: 'Hello world!' } });
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: true })
      );

      // 3. Send message
      await act(async () => {
        fireEvent.click(sendButton);
      });

      // 4. Should clear typing and send message
      expect(setTyping).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );
      expect(createTextMessage).toHaveBeenCalled();
      expect(textarea.value).toBe('');
    });

    test('should handle message send failure gracefully', async () => {
      // Mock message send to fail
      createTextMessage.mockRejectedValueOnce(new Error('Network error'));
      
      // Mock alert to avoid actual alert popup in test
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <ChatStateProvider>
          <ChatInput 
            getDisplayName={() => 'Test User'}
            soundEnabled={false}
            forceScrollBottom={jest.fn()}
          />
        </ChatStateProvider>
      );

      const textarea = screen.getByLabelText(/message text/i);
      const sendButton = screen.getByRole('button', { name: /send message/i });

      fireEvent.change(textarea, { target: { value: 'Test message' } });

      await act(async () => {
        fireEvent.click(sendButton);
      });

      // Note: We now use toast notifications instead of alerts
      // The error should be handled gracefully without crashing
      expect(createTextMessage).toHaveBeenCalled();
      
      // Should still clear typing indicator even on failure
      // Note: handleInputActivity(0) is called before sendMessage, so we check for typing: false call
      expect(setTyping).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ typing: false })
      );

      alertSpy.mockRestore();
    });
  });
});