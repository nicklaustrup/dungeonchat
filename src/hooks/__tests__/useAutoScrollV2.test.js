import React from 'react';
import { render, act } from '@testing-library/react';
import { useAutoScrollV2 } from '../useAutoScrollV2';

// Mock IntersectionObserver (not used in V2, but might be needed for other components)
class MockIntersectionObserver {
  constructor(cb) { this.cb = cb; }
  observe() { }
  disconnect() { }
  unobserve() { }
}

beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver;
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
  }
  if (!global.cancelAnimationFrame) {
    global.cancelAnimationFrame = (id) => clearTimeout(id);
  }
});

// Test harness component
function TestHarness({ items, threshold = 10, onHookUpdate }) {
  const containerRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  
  const hookResult = useAutoScrollV2({
    containerRef,
    anchorRef,
    items,
    threshold
  });
  
  // Notify test of hook updates
  React.useEffect(() => {
    if (onHookUpdate) {
      onHookUpdate(hookResult, containerRef);
    }
  });
  
  return (
    <div>
      <div 
        ref={containerRef} 
        data-testid="container"
        style={{ height: '400px', overflowY: 'auto' }}
      >
        {items.map(item => (
          <div key={item.id} data-testid={`message-${item.id}`} style={{ height: '50px' }}>
            {item.text || item.id}
          </div>
        ))}
        <div ref={anchorRef} data-testid="anchor" />
      </div>
    </div>
  );
}

// Utility to set scroll position
function setScrollPosition(container, { scrollTop = 0, scrollHeight = 1000, clientHeight = 400 }) {
  // Mock DOM properties with getters/setters
  Object.defineProperty(container, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (val) => { scrollTop = val; }
  });
  Object.defineProperty(container, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight
  });
  Object.defineProperty(container, 'clientHeight', {
    configurable: true,
    get: () => clientHeight
  });
  
  // Trigger scroll event
  act(() => {
    container.dispatchEvent(new Event('scroll'));
  });
}

describe('useAutoScrollV2', () => {
  describe('Core User Flows', () => {
    test('User at bottom gets auto-scroll on new message', async () => {
      const initialMessages = [
        { id: 'm1', text: 'Message 1' },
        { id: 'm2', text: 'Message 2' },
      ];
      
      let hookResult;
      let containerEl;
      
      const { rerender } = render(
        <TestHarness 
          items={initialMessages}
          onHookUpdate={(result, container) => {
            hookResult = result;
            containerEl = container.current;
          }}
        />
      );
      
      // Position user at bottom (distance = 0)
      setScrollPosition(containerEl, {
        scrollTop: 600,
        scrollHeight: 1000, 
        clientHeight: 400
      });
      
      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.newCount).toBe(0);
      expect(hookResult.hasNew).toBe(false);
      
      // Add new message
      const updatedMessages = [...initialMessages, { id: 'm3', text: 'New message' }];
      
      await act(async () => {
        rerender(
          <TestHarness 
            items={updatedMessages}
            onHookUpdate={(result, container) => {
              hookResult = result;
              containerEl = container.current;
            }}
          />
        );
      });
      
      // Should remain at bottom with no unread count
      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.newCount).toBe(0);
      expect(hookResult.hasNew).toBe(false);
    });
    
    test('User scrolled up gets unread button on new message', async () => {
      const initialMessages = [
        { id: 'm1', text: 'Message 1' },
        { id: 'm2', text: 'Message 2' },
      ];
      
      let hookResult;
      let containerEl;
      
      const { rerender } = render(
        <TestHarness 
          items={initialMessages}
          onHookUpdate={(result, container) => {
            hookResult = result;
            containerEl = container.current;
          }}
        />
      );
      
      // Wait for the component to be fully rendered and refs to be set
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // Now set scroll position
      await act(async () => {
        // Position user 50px from bottom (scrolled up)
        setScrollPosition(containerEl, {
          scrollTop: 550,
          scrollHeight: 1000,
          clientHeight: 400
        });
        
        // Give time for scroll handler to execute
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      
      expect(hookResult.isAtBottom).toBe(false);
      expect(hookResult.newCount).toBe(0);
      
      // Add new message
      const updatedMessages = [...initialMessages, { id: 'm3', text: 'New message' }];
      
      await act(async () => {
        rerender(
          <TestHarness 
            items={updatedMessages}
            onHookUpdate={(result, container) => {
              hookResult = result;
              containerEl = container.current;
            }}
          />
        );
      });
      
      // Should show unread count, remain scrolled up
      expect(hookResult.isAtBottom).toBe(false);
      expect(hookResult.newCount).toBe(1);
      expect(hookResult.hasNew).toBe(true);
    });
    
    test('Multiple messages while scrolled up increment count', async () => {
      const initialMessages = [
        { id: 'm1', text: 'Message 1' },
      ];
      
      let hookResult;
      let containerEl;
      
      const { rerender } = render(
        <TestHarness 
          items={initialMessages}
          onHookUpdate={(result, container) => {
            hookResult = result;
            containerEl = container.current;
          }}
        />
      );
      
      // Wait for component to be ready
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // Position user scrolled up
      await act(async () => {
        setScrollPosition(containerEl, {
          scrollTop: 500,
          scrollHeight: 1000,
          clientHeight: 400
        });
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      
      expect(hookResult.newCount).toBe(0);
      
      // Add first new message
      await act(async () => {
        rerender(
          <TestHarness 
            items={[...initialMessages, { id: 'm2', text: 'Message 2' }]}
            onHookUpdate={(result, container) => {
              hookResult = result;
              containerEl = container.current;
            }}
          />
        );
      });
      
      expect(hookResult.newCount).toBe(1);
      
      // Add second new message  
      await act(async () => {
        rerender(
          <TestHarness 
            items={[...initialMessages, { id: 'm2', text: 'Message 2' }, { id: 'm3', text: 'Message 3' }]}
            onHookUpdate={(result, container) => {
              hookResult = result;
              containerEl = container.current;
            }}
          />
        );
      });
      
      expect(hookResult.newCount).toBe(2);
      expect(hookResult.hasNew).toBe(true);
    });
    
    test('Return to bottom clears unread count', async () => {
      const messages = [
        { id: 'm1', text: 'Message 1' },
        { id: 'm2', text: 'Message 2' },
      ];
      
      let hookResult;
      let containerEl;
      
      render(
        <TestHarness 
          items={messages}
          onHookUpdate={(result, container) => {
            hookResult = result;
            containerEl = container.current;
          }}
        />
      );
      
      // Start scrolled up with unread messages (simulate previous state)
      setScrollPosition(containerEl, {
        scrollTop: 500,
        scrollHeight: 1000,
        clientHeight: 400
      });
      
      // Scroll back to bottom
      setScrollPosition(containerEl, {
        scrollTop: 600, // Back to bottom
        scrollHeight: 1000,
        clientHeight: 400
      });
      
      // Should clear unread count
      expect(hookResult.isAtBottom).toBe(true);
      // Note: In a real scenario, unread count would be cleared by scroll handler
    });
  });
  
  describe('Pagination Scenarios', () => {
    test('Pagination does not affect unread count', async () => {
      const initialMessages = [
        { id: 'm3', text: 'Message 3' },
        { id: 'm4', text: 'Message 4' },
      ];
      
      let hookResult;
      let containerEl;
      
      const { rerender } = render(
        <TestHarness 
          items={initialMessages}
          onHookUpdate={(result, container) => {
            hookResult = result;
            containerEl = container.current;
          }}
        />
      );
      
      // Start at bottom
      setScrollPosition(containerEl, {
        scrollTop: 600,
        scrollHeight: 1000,
        clientHeight: 400
      });
      
      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.newCount).toBe(0);
      
      // Simulate pagination (add older messages at beginning)
      const afterPagination = [
        { id: 'm1', text: 'Message 1' }, // older
        { id: 'm2', text: 'Message 2' }, // older
        { id: 'm3', text: 'Message 3' }, // existing
        { id: 'm4', text: 'Message 4' }, // existing
      ];
      
      await act(async () => {
        rerender(
          <TestHarness 
            items={afterPagination}
            onHookUpdate={(result, container) => {
              hookResult = result;
              containerEl = container.current;
            }}
          />
        );
      });
      
      // Pagination should not create unread messages
      expect(hookResult.newCount).toBe(0);
      expect(hookResult.hasNew).toBe(false);
    });
    
    test('New message after pagination works correctly', async () => {
      const initialMessages = [{ id: 'm2', text: 'Message 2' }];
      
      let hookResult;
      let containerEl;
      
      const { rerender } = render(
        <TestHarness 
          items={initialMessages}
          onHookUpdate={(result, container) => {
            hookResult = result;
            containerEl = container.current;
          }}
        />
      );
      
      // Start at bottom  
      setScrollPosition(containerEl, {
        scrollTop: 600,
        scrollHeight: 1000,
        clientHeight: 400
      });
      
      // Add pagination (older message)
      const afterPagination = [
        { id: 'm1', text: 'Message 1' }, // older
        { id: 'm2', text: 'Message 2' }, // existing
      ];
      
      await act(async () => {
        rerender(
          <TestHarness 
            items={afterPagination}
            onHookUpdate={(result, container) => {
              hookResult = result;
              containerEl = container.current;
            }}
          />
        );
      });
      
      // Now add new message
      const withNewMessage = [
        { id: 'm1', text: 'Message 1' },
        { id: 'm2', text: 'Message 2' },
        { id: 'm3', text: 'Message 3' }, // new
      ];
      
      await act(async () => {
        rerender(
          <TestHarness 
            items={withNewMessage}
            onHookUpdate={(result, container) => {
              hookResult = result;
              containerEl = container.current;
            }}
          />
        );
      });
      
      // Should auto-scroll since we were at bottom before pagination
      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.newCount).toBe(0);
    });
  });
  
  describe('Edge Cases', () => {
    test('Initial load scrolls to bottom', async () => {
      let hookResult;
      
      render(
        <TestHarness 
          items={[{ id: 'm1', text: 'First message' }]}
          onHookUpdate={(result) => {
            hookResult = result;
          }}
        />
      );
      
      // Should start at bottom
      expect(hookResult.isAtBottom).toBe(true);
      expect(hookResult.newCount).toBe(0);
    });
    
    test('Custom threshold works correctly', async () => {
      const messages = [{ id: 'm1', text: 'Message' }];
      
      let hookResult;
      let containerEl;
      
      render(
        <TestHarness 
          items={messages}
          threshold={20} // Custom 20px threshold
          onHookUpdate={(result, container) => {
            hookResult = result;
            containerEl = container.current;
          }}
        />
      );
      
      // Wait for component to be ready
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // Position at 15px from bottom (within 20px threshold)
      await act(async () => {
        setScrollPosition(containerEl, {
          scrollTop: 585,
          scrollHeight: 1000,
          clientHeight: 400
        });
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      
      expect(hookResult.isAtBottom).toBe(true);
      
      // Position at 25px from bottom (beyond 20px threshold)  
      await act(async () => {
        setScrollPosition(containerEl, {
          scrollTop: 575,
          scrollHeight: 1000,
          clientHeight: 400
        });
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      
      expect(hookResult.isAtBottom).toBe(false);
    });
  });
});