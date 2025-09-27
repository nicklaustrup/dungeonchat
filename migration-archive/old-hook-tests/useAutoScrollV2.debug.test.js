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

describe('useAutoScrollV2 - Debug Tests', () => {
  test('Debug scroll position detection - after initial load', () => {
    let hookResult;
    let containerEl;

    const TestComponent = () => {
      const containerRef = React.useRef();
      const anchorRef = React.useRef();
      
      const result = useAutoScrollV2({
        containerRef,
        anchorRef,
        items: [{ id: 'msg1', text: 'Message 1' }],
        threshold: 60
      });

      hookResult = result;

      React.useLayoutEffect(() => {
        containerEl = containerRef.current;
      });

      return (
        <div
          ref={containerRef}
          style={{ height: 400, overflowY: 'auto' }}
        >
          <div style={{ height: 50 }}>Message 1</div>
          <div ref={anchorRef} style={{ height: 1 }} />
        </div>
      );
    };

    render(<TestComponent />);

    // Allow initial load RAF to complete
    act(() => {
      jest.runAllTimers();
    });

    console.log('After initial load isAtBottom:', hookResult.isAtBottom);

    // Now set scroll position
    Object.defineProperties(containerEl, {
      scrollTop: { value: 500, writable: true },
      scrollHeight: { value: 2000, writable: true },
      clientHeight: { value: 400, writable: true }
    });

    // Calculate expected distance
    const distance = 2000 - (500 + 400); // = 1100
    console.log('Distance from bottom:', distance);
    console.log('Should be at bottom:', distance <= 60);

    // Trigger scroll event
    const event = new Event('scroll', { bubbles: true });
    containerEl.dispatchEvent(event);

    // Allow RAF to complete
    act(() => {
      jest.runAllTimers();
    });

    console.log('Final isAtBottom:', hookResult.isAtBottom);
    
    // Should not be at bottom since 1100 > 60
    expect(hookResult.isAtBottom).toBe(false);
  });
});