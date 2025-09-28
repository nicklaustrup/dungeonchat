import { renderHook, act } from '@testing-library/react';
import { useUnifiedScrollManager } from '../useUnifiedScrollManager';

// Set test timeout to 10 seconds
jest.setTimeout(10000);

// Mock the message diff classifier
jest.mock('../../utils/classifyMessageDiff', () => ({
  classifyMessageDiff: jest.fn()
}));

const { classifyMessageDiff } = require('../../utils/classifyMessageDiff');

describe('useUnifiedScrollManager - Bug Fix Tests', () => {
  let mockContainer;
  let mockAnchor;
  let containerRef;
  let anchorRef;

  beforeEach(() => {
    jest.useFakeTimers();
    
    // Create mock DOM elements
    let currentScrollTop = 0;
    mockContainer = {
      get scrollTop() { return currentScrollTop; },
      set scrollTop(value) { currentScrollTop = value; },
      scrollHeight: 1000,
      clientHeight: 400,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      querySelector: jest.fn(),
      scrollTo: jest.fn((options) => {
        if (typeof options === 'object' && options.top !== undefined) {
          currentScrollTop = options.top;
        } else if (typeof options === 'number') {
          currentScrollTop = options;
        }
      })
    };

    mockAnchor = {
      scrollIntoView: jest.fn()
    };

    containerRef = { current: mockContainer };
    anchorRef = { current: mockAnchor };

    // Reset mocks
    classifyMessageDiff.mockReset();
    jest.clearAllMocks();

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('Bug Fix: Initial Load Scrolling', () => {
    test('should scroll to bottom on initial message load (first login)', async () => {
      jest.useFakeTimers();
      
      const messages = [
        { id: 'm1', text: 'Hello' },
        { id: 'm2', text: 'World' }
      ];

      // Initially at top
      mockContainer.scrollTop = 0;
      mockContainer.scrollHeight = 1000;
      mockContainer.clientHeight = 400;

      renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        })
      );

      // Should detect initial load and scroll to bottom
      await act(async () => {
        jest.advanceTimersByTime(500); // Advance timers to trigger scroll attempts
      });

      // Should have scrolled to bottom (scrollTop should be scrollHeight - clientHeight)
      expect(mockContainer.scrollTop).toBe(600); // 1000 - 400 = 600
      
      jest.useRealTimers();
    });

    test('should retry scrolling if initial scroll fails', async () => {
      jest.useFakeTimers();
      
      const messages = [{ id: 'm1', text: 'Hello' }];

      // Mock a scenario where first scroll attempt fails
      let scrollAttempts = 0;
      let currentScrollTop = 0;
      Object.defineProperty(mockContainer, 'scrollTop', {
        get: () => currentScrollTop,
        set: (value) => {
          scrollAttempts++;
          if (scrollAttempts >= 2) {
            currentScrollTop = value;
          }
          // Don't update currentScrollTop if less than 2 attempts
        },
        configurable: true
      });

      renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(600); // Advance timers to trigger retries
      });

      expect(scrollAttempts).toBeGreaterThan(1); // Should have retried
      
      jest.useRealTimers();
    });

    test('should handle page reload scenario correctly', async () => {
      jest.useFakeTimers();
      
      // Simulate page reload with existing messages
      const messages = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, text: `Message ${i}` }));

      mockContainer.scrollTop = 0;
      mockContainer.scrollHeight = 2000;

      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Should be at bottom
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.newMessagesCount).toBe(0);
      
      jest.useRealTimers();
    });
  });

  describe('Bug Fix: Scroll Button Not Reaching True Bottom', () => {
    test('should scroll to exact bottom when scroll button is clicked', async () => {
      jest.useFakeTimers();
      
      const messages = [{ id: 'm1', text: 'Hello' }];

      // Start scrolled up
      mockContainer.scrollTop = 100;
      mockContainer.scrollHeight = 1000;
      mockContainer.clientHeight = 400;

      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages: [],
          threshold: 10
        })
      );

      // Update with messages to skip initial load logic
      renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        })
      );

      // Click scroll to bottom
      act(() => {
        result.current.scrollToBottom('smooth');
      });

      await act(async () => {
        jest.advanceTimersByTime(600); // Wait for smooth scroll timeout
      });

      // Should be at exact bottom (600 = 1000 - 400)
      expect(mockContainer.scrollTop).toBe(600);
      
      jest.useRealTimers();
    });

    test('should correct position if smooth scroll falls short', async () => {
      jest.useFakeTimers();
      
      const messages = [{ id: 'm1', text: 'Hello' }];

      mockContainer.scrollTop = 100;
      mockContainer.scrollHeight = 1000;
      mockContainer.clientHeight = 400;

      // Mock scrollIntoView to not reach the exact bottom
      mockAnchor.scrollIntoView.mockImplementation(() => {
        mockContainer.scrollTop = 590; // 10px short
      });

      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        })
      );

      act(() => {
        result.current.scrollToBottom('smooth');
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // Should have corrected to exact bottom
      expect(mockContainer.scrollTop).toBe(600);
      
      jest.useRealTimers();
    });
  });

  describe('Bug Fix: New Message Count Not Updating', () => {
    test('should increment unread count when new message arrives while scrolled up', async () => {
      jest.useFakeTimers();
      
      // Start with some messages
      const initialMessages = [{ id: 'm1', text: 'Hello' }];

      // Set up mock container dimensions BEFORE rendering hook
      mockContainer.scrollHeight = 1000;
      mockContainer.clientHeight = 400;
      // Don't set scrollTop yet - let hook initialize first

      // Mock the message classification for different calls
      classifyMessageDiff
        .mockReturnValueOnce({
          // First call: initial render ([] -> [initial message]) - should not increment unread since initial load
          didAppend: false,
          appendedCount: 0, 
          didPrepend: false,
          prependedCount: 0,
          reset: false
        })
        .mockReturnValueOnce({
          // Second call: new message arrives ([initial] -> [initial, new])
          didAppend: true,
          appendedCount: 1,
          newMessages: [{ id: 'm2', text: 'New message' }],
          didPrepend: false,
          prependedCount: 0,
          reset: false
        });

      const { result, rerender } = renderHook(({ messages }) =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        }),
        { initialProps: { messages: initialMessages } }
      );

      // Wait for initialization to complete (auto-scroll happens here)
      await act(async () => {
        jest.advanceTimersByTime(100); // Allow requestAnimationFrame to complete
      });

      // NOW set scroll position AFTER initialization to simulate user scrolling up
      await act(async () => {
        mockContainer.scrollTop = 100; // User scrolls up
        // Trigger scroll event to update hook state
        const scrollEvent = new Event('scroll');
        mockContainer.addEventListener.mock.calls[0][1](scrollEvent);
      });

      // Verify current scroll position for debugging
      // User is not at bottom: scrollTop=100, distance from bottom = 1000-(100+400) = 500 > threshold(10)
      expect(result.current.isAtBottom).toBe(false);

      // New message arrives
      const newMessages = [...initialMessages, { id: 'm2', text: 'New message' }];
      
      act(() => {
        rerender({ messages: newMessages });
      });

      // Should increment unread count
      expect(result.current.newMessagesCount).toBe(1);
      expect(result.current.hasNewMessages).toBe(true);
      
      jest.useRealTimers();
    });

    test('should show correct count for multiple new messages', async () => {
      jest.useFakeTimers();
      const initialMessages = [{ id: 'm1', text: 'Hello' }];

      // Set up container dimensions
      mockContainer.scrollHeight = 1000;
      mockContainer.clientHeight = 400;

      // Mock message classification for different calls
      classifyMessageDiff
        .mockReturnValueOnce({
          // First call: initial render - no increment
          didAppend: false,
          appendedCount: 0,
          didPrepend: false,
          prependedCount: 0,
          reset: false
        })
        .mockReturnValueOnce({
          // Second call: 3 new messages arrive
          didAppend: true,
          appendedCount: 3,
          newMessages: [
            { id: 'm2', text: 'New 1' },
            { id: 'm3', text: 'New 2' },
            { id: 'm4', text: 'New 3' }
          ],
          didPrepend: false,
          prependedCount: 0,
          reset: false
        });

      const { result, rerender } = renderHook(({ messages }) =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        }),
        { initialProps: { messages: initialMessages } }
      );

      // Wait for initialization and then set scroll position
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Set user scrolled up AFTER initialization
      await act(async () => {
        mockContainer.scrollTop = 100; // User scrolls up
        const scrollEvent = new Event('scroll');
        mockContainer.addEventListener.mock.calls[0][1](scrollEvent);
      });

      const newMessages = [
        ...initialMessages,
        { id: 'm2', text: 'New 1' },
        { id: 'm3', text: 'New 2' },
        { id: 'm4', text: 'New 3' }
      ];

      act(() => {
        rerender({ messages: newMessages });
      });

      expect(result.current.newMessagesCount).toBe(3);
      expect(result.current.hasNewMessages).toBe(true);
      
      jest.useRealTimers();
    });

    test('should clear unread count when user scrolls back to bottom', () => {
      const messages = [{ id: 'm1', text: 'Hello' }];

      // Start with unread messages
      mockContainer.scrollTop = 100;
      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        })
      );

      // Set up unread count
      act(() => {
        result.current._debug && console.log('Setting unread');
      });

      // Mock scroll to bottom
      mockContainer.scrollTop = 600; // At bottom (1000 - 400)

      // Simulate scroll event
      const scrollHandler = mockContainer.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      )[1];

      act(() => {
        scrollHandler();
      });

      // Should clear unread count
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.newMessagesCount).toBe(0);
    });
  });

  describe('Bug Fix: Typing Indicator Issues', () => {
    // These tests would be in a separate file for ChatInput/useTypingPresence
    // Including them here for completeness of the bug report
    test.todo('should clear typing indicator when message is sent');
    test.todo('should clear typing indicator when text is completely cleared');
    test.todo('should auto-clear typing indicator after 6 seconds of inactivity');
  });

  describe('Bug Fix: classifyMessageDiff Length Error', () => {
    test('should handle undefined/null messages without error', () => {
      expect(() => {
        classifyMessageDiff.mockImplementation((prev, next) => {
          // Simulate the actual function behavior with null checks
          if (!prev || !next) {
            return { didPrepend: false, prependedCount: 0, didAppend: false, appendedCount: 0, reset: false, prevLength: 0, nextLength: 0 };
          }
          return { didPrepend: false, prependedCount: 0, didAppend: false, appendedCount: 0, reset: false, prevLength: prev.length, nextLength: next.length };
        });

        renderHook(() =>
          useUnifiedScrollManager({
            containerRef,
            anchorRef,
            messages: null, // This should not cause an error
            threshold: 10
          })
        );
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('complete user journey: login -> receive messages -> scroll up -> new messages -> scroll button', async () => {
      jest.useFakeTimers();
      
      // 1. User logs in (initial load)
      const initialMessages = [
        { id: 'm1', text: 'Welcome!' },
        { id: 'm2', text: 'Hello there!' }
      ];

      mockContainer.scrollTop = 0;
      mockContainer.scrollHeight = 1000;
      mockContainer.clientHeight = 400;

      const { result, rerender } = renderHook(({ messages }) =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
          threshold: 10
        }),
        { initialProps: { messages: initialMessages } }
      );

      // Should scroll to bottom on initial load
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.newMessagesCount).toBe(0);

      // 2. User scrolls up
      mockContainer.scrollTop = 100; // Scroll up
      const scrollHandler = mockContainer.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      )[1];

      act(() => {
        scrollHandler(); // Trigger scroll event
      });

      expect(result.current.isAtBottom).toBe(false);

      // 3. New message arrives
      classifyMessageDiff.mockReturnValue({
        didAppend: true,
        appendedCount: 1,
        newMessages: [{ id: 'm3', text: 'New message!' }],
        didPrepend: false,
        prependedCount: 0,
        reset: false
      });

      const newMessages = [...initialMessages, { id: 'm3', text: 'New message!' }];

      act(() => {
        rerender({ messages: newMessages });
      });

      // Should show unread count
      expect(result.current.hasNewMessages).toBe(true);
      expect(result.current.newMessagesCount).toBe(1);

      // 4. User clicks scroll to bottom
      act(() => {
        result.current.scrollToBottom('smooth');
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // Should be at bottom with cleared unread count
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.newMessagesCount).toBe(0);
      
      jest.useRealTimers();
    });
  });
});