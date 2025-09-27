import React from 'react';
import { render, act } from '@testing-library/react';
import { useAutoScrollV2 } from '../useAutoScrollV2';

// Mock IntersectionObserver and scrollIntoView for testing
beforeAll(() => {
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  }));

  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  }
  
  if (!HTMLElement.prototype.scrollTo) {
    HTMLElement.prototype.scrollTo = jest.fn();
  }
  
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('useAutoScrollV2 - Regression Tests for Scroll Issues', () => {
  let containerEl, hookResult;

  const TestHarness = ({ items = [], threshold = 60, onUpdate = () => {} }) => {
    const containerRef = React.useRef();
    const anchorRef = React.useRef();
    const result = useAutoScrollV2({
      containerRef,
      anchorRef,
      items,
      threshold
    });

    React.useLayoutEffect(() => {
      onUpdate(result, containerRef, anchorRef);
    });

    return (
      <div
        ref={containerRef}
        style={{
          height: 400,
          overflowY: 'auto'
        }}
        data-testid="chat-container"
      >
        {items.map(item => (
          <div key={item.id} style={{ height: 50, padding: 10 }}>
            {item.text}
          </div>
        ))}
        <div ref={anchorRef} data-testid="dummy-anchor" style={{ height: 1 }} />
      </div>
    );
  };

  const setScrollPosition = (element, { scrollTop, scrollHeight = 2000, clientHeight = 400 }) => {
    Object.defineProperties(element, {
      scrollTop: { value: scrollTop, writable: true },
      scrollHeight: { value: scrollHeight, writable: true },
      clientHeight: { value: clientHeight, writable: true }
    });
    
    // Trigger scroll event synchronously
    const event = new Event('scroll', { bubbles: true });
    element.dispatchEvent(event);
    
    // Allow RAF to complete (our hook uses requestAnimationFrame)
    act(() => {
      jest.runAllTimers();
    });
  };

  beforeEach(() => {
    containerEl = null;
    hookResult = null;
    
    // Reset scroll behavior mocks
    HTMLElement.prototype.scrollIntoView.mockClear();
  });

  describe('Issue 1: Initial Load Positioning', () => {
    test('Initial load with many messages scrolls to bottom (most recent)', () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({ 
        id: `msg${i}`, 
        text: `Message ${i}`,
        timestamp: Date.now() + i 
      }));

      render(
        <TestHarness 
          items={messages}
          onUpdate={(result, containerRef, anchorRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Should start at bottom
      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.hasNew).toBe(false);
      expect(hookResult.newCount).toBe(0);

      // Should have scrolled to bottom (new implementation uses direct scrollTop)
      expect(containerEl.scrollTop).toBe(containerEl.scrollHeight - containerEl.clientHeight);
    });

    test('Initial load with no messages should be at bottom', () => {
      render(
        <TestHarness 
          items={[]}
          onUpdate={(result, containerRef, anchorRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.hasNew).toBe(false);
      expect(hookResult.newCount).toBe(0);
    });

    test('Initial load then adding first message scrolls to bottom', () => {
      const { rerender } = render(
        <TestHarness 
          items={[]}
          onUpdate={(result) => { hookResult = result; }}
        />
      );

      // Add first message
      act(() => {
        rerender(
          <TestHarness 
            items={[{ id: 'first', text: 'First message' }]}
            onUpdate={(result) => { hookResult = result; }}
          />
        );
      });

      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.hasNew).toBe(false);
    });
  });

  describe('Issue 2: Scroll to Bottom Function', () => {
    test('scrollToBottom() reaches the actual bottom', () => {
      const messages = Array.from({ length: 20 }, (_, i) => ({ 
        id: `msg${i}`, 
        text: `Message ${i}` 
      }));

      render(
        <TestHarness 
          items={messages}
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Simulate being scrolled up
      setScrollPosition(containerEl, {
        scrollTop: 100,
        scrollHeight: 2000,
        clientHeight: 400
      });

      act(() => {
        hookResult.scrollToBottom();
      });

      // After rAF, should be at bottom
      act(() => {
        jest.runAllTimers();
      });

      // The scrollToBottom should have updated state to bottom
      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.newCount).toBe(0);
    });

    test('scrollToBottom() with instant behavior works immediately', () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({ 
        id: `msg${i}`, 
        text: `Message ${i}` 
      }));

      render(
        <TestHarness 
          items={messages}
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Simulate being scrolled up
      setScrollPosition(containerEl, {
        scrollTop: 100,
        scrollHeight: 2000,
        clientHeight: 400
      });

      act(() => {
        hookResult.scrollToBottom('instant');
      });

      // Wait for the nested requestAnimationFrame calls to complete
      act(() => {
        jest.runAllTimers();
      });

      expect(hookResult.isAtBottom).toBe(true);
    });
  });

  describe('Issue 3: Unread Count Not Updating', () => {
    test('New message while button visible should increment unread count', () => {
      // Start with empty messages to avoid initial scroll
      const { rerender } = render(
        <TestHarness 
          items={[]}
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Add initial messages - this will trigger initial load scroll
      const initialMessages = [
        { id: 'msg1', text: 'Message 1' },
        { id: 'msg2', text: 'Message 2' }
      ];

      act(() => {
        rerender(
          <TestHarness 
            items={initialMessages}
            onUpdate={(result, containerRef) => {
              hookResult = result;
              containerEl = containerRef.current;
            }}
          />
        );
      });

      // Wait for initial scroll to complete
      act(() => {
        jest.runAllTimers();
      });

      // Now scroll up so scroll-to-bottom button should be visible
      setScrollPosition(containerEl, {
        scrollTop: 500,
        scrollHeight: 2000,
        clientHeight: 400
      });

      // Should not be at bottom
      expect(hookResult.isAtBottom).toBe(false);

      // Add new message
      const newMessages = [
        ...initialMessages,
        { id: 'msg3', text: 'Message 3' }
      ];

      act(() => {
        rerender(
          <TestHarness 
            items={newMessages}
            onUpdate={(result, containerRef) => {
              hookResult = result;
              containerEl = containerRef.current;
            }}
          />
        );
      });

      // Should increment unread count
      expect(hookResult.hasNew).toBe(true);
      expect(hookResult.newCount).toBe(1);
      expect(hookResult.isAtBottom).toBe(false);
    });

    test('Multiple new messages while scrolled up increment count correctly', () => {
      // Start with empty messages to avoid initial scroll
      const { rerender } = render(
        <TestHarness 
          items={[]}
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Add initial messages
      const initialMessages = [
        { id: 'msg1', text: 'Message 1' },
        { id: 'msg2', text: 'Message 2' }
      ];

      act(() => {
        rerender(
          <TestHarness 
            items={initialMessages}
            onUpdate={(result, containerRef) => {
              hookResult = result;
              containerEl = containerRef.current;
            }}
          />
        );
      });

      // Wait for initial scroll to complete
      act(() => {
        jest.runAllTimers();
      });

      // Scroll up
      setScrollPosition(containerEl, {
        scrollTop: 500,
        scrollHeight: 2000,
        clientHeight: 400
      });

      // Add first new message
      act(() => {
        rerender(
          <TestHarness 
            items={[...initialMessages, { id: 'msg3', text: 'Message 3' }]}
            onUpdate={(result) => { hookResult = result; }}
          />
        );
      });

      expect(hookResult.newCount).toBe(1);

      // Add second new message
      act(() => {
        rerender(
          <TestHarness 
            items={[
              ...initialMessages, 
              { id: 'msg3', text: 'Message 3' },
              { id: 'msg4', text: 'Message 4' }
            ]}
            onUpdate={(result) => { hookResult = result; }}
          />
        );
      });

      expect(hookResult.newCount).toBe(2);
      expect(hookResult.hasNew).toBe(true);
    });

    test('Scrolling to bottom clears unread count', () => {
      const messages = [
        { id: 'msg1', text: 'Message 1' },
        { id: 'msg2', text: 'Message 2' },
        { id: 'msg3', text: 'Message 3' }
      ];

      render(
        <TestHarness 
          items={messages}
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Manually set unread count by scrolling up then adding message
      setScrollPosition(containerEl, {
        scrollTop: 500,
        scrollHeight: 2000,
        clientHeight: 400
      });

      // Simulate having unread messages
      act(() => {
        hookResult.scrollToBottom();
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.newCount).toBe(0);
      expect(hookResult.hasNew).toBe(false);
    });
  });

  describe('Issue 3.1: Pagination Forces Unread Button Render', () => {
    test('Loading older messages (pagination) should not affect unread count', () => {
      // Start with empty messages to avoid initial scroll
      const { rerender } = render(
        <TestHarness 
          items={[]}
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Add initial recent messages
      const recentMessages = [
        { id: 'msg8', text: 'Message 8' },
        { id: 'msg9', text: 'Message 9' },
        { id: 'msg10', text: 'Message 10' }
      ];

      act(() => {
        rerender(
          <TestHarness 
            items={recentMessages}
            onUpdate={(result, containerRef) => {
              hookResult = result;
              containerEl = containerRef.current;
            }}
          />
        );
      });

      // Wait for initial scroll to complete
      act(() => {
        jest.runAllTimers();
      });

      // Scroll up so user is not at bottom and add some unread count
      setScrollPosition(containerEl, {
        scrollTop: 500,
        scrollHeight: 2000,
        clientHeight: 400
      });

      // Add new message to create unread count
      act(() => {
        rerender(
          <TestHarness 
            items={[...recentMessages, { id: 'msg11', text: 'Message 11' }]}
            onUpdate={(result) => { hookResult = result; }}
          />
        );
      });

      const unreadCountBefore = hookResult.newCount;
      expect(unreadCountBefore).toBe(1);

      // Now simulate pagination (adding older messages at beginning)
      const withOlderMessages = [
        { id: 'msg5', text: 'Message 5' },
        { id: 'msg6', text: 'Message 6' },
        { id: 'msg7', text: 'Message 7' },
        ...recentMessages,
        { id: 'msg11', text: 'Message 11' }
      ];

      act(() => {
        rerender(
          <TestHarness 
            items={withOlderMessages}
            onUpdate={(result) => { hookResult = result; }}
          />
        );
      });

      // Pagination should not affect unread count
      expect(hookResult.newCount).toBe(unreadCountBefore);
      expect(hookResult.hasNew).toBe(true);
    });

    test('Pagination followed by new message should correctly increment count', () => {
      // Start with empty messages to avoid initial scroll
      const { rerender } = render(
        <TestHarness 
          items={[]}
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Add initial messages
      const initialMessages = [
        { id: 'msg3', text: 'Message 3' },
        { id: 'msg4', text: 'Message 4' }
      ];

      act(() => {
        rerender(
          <TestHarness 
            items={initialMessages}
            onUpdate={(result, containerRef) => {
              hookResult = result;
              containerEl = containerRef.current;
            }}
          />
        );
      });

      // Wait for initial scroll to complete
      act(() => {
        jest.runAllTimers();
      });

      // User scrolls up
      setScrollPosition(containerEl, {
        scrollTop: 300,
        scrollHeight: 1000,
        clientHeight: 400
      });

      // Simulate pagination (prepend older messages)
      const withPagination = [
        { id: 'msg1', text: 'Message 1' },
        { id: 'msg2', text: 'Message 2' },
        ...initialMessages
      ];

      act(() => {
        rerender(
          <TestHarness 
            items={withPagination}
            onUpdate={(result) => { hookResult = result; }}
          />
        );
      });

      expect(hookResult.newCount).toBe(0); // Pagination shouldn't add unread

      // Now add a new message at the end
      act(() => {
        rerender(
          <TestHarness 
            items={[...withPagination, { id: 'msg5', text: 'Message 5' }]}
            onUpdate={(result) => { hookResult = result; }}
          />
        );
      });

      expect(hookResult.newCount).toBe(1); // Should increment for new message
      expect(hookResult.hasNew).toBe(true);
    });
  });

  describe('Threshold Configuration', () => {
    test('Different threshold values work correctly', () => {
      const messages = [{ id: 'msg1', text: 'Message 1' }];

      render(
        <TestHarness 
          items={messages}
          threshold={100} // Larger threshold
          onUpdate={(result, containerRef) => {
            hookResult = result;
            containerEl = containerRef.current;
          }}
        />
      );

      // Set scroll position within the threshold
      setScrollPosition(containerEl, {
        scrollTop: 1450, // 50px from bottom
        scrollHeight: 1600,
        clientHeight: 100
      });

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Should still be considered "at bottom" due to larger threshold
      expect(hookResult.isAtBottom).toBe(true);

      // Set scroll position outside the threshold
      setScrollPosition(containerEl, {
        scrollTop: 1300, // 200px from bottom
        scrollHeight: 1600,
        clientHeight: 100
      });

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Should not be at bottom
      expect(hookResult.isAtBottom).toBe(false);
    });
  });
});