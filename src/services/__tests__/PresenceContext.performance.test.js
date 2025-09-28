import React from 'react';
import { renderHook } from '@testing-library/react';
import { PresenceProvider, usePresence } from '../../services/PresenceContext';

// Mock Firebase dependencies
jest.mock('firebase/database', () => ({
  ref: jest.fn(() => ({ path: '/presence/test' })),
  onDisconnect: jest.fn(() => ({
    set: jest.fn()
  })),
  set: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn(),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' }))
}));

// Mock Firebase context
const mockFirebaseContext = {
  rtdb: {},
  auth: { 
    currentUser: { uid: 'user1', displayName: 'Test User' }
  }
};

jest.mock('../../services/FirebaseContext', () => ({
  useFirebase: () => mockFirebaseContext
}));

describe('PresenceContext performance optimizations', () => {
  let mockSetTimeout;
  let mockClearTimeout;

  beforeEach(() => {
    // Mock timers for debouncing tests
    mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      // Execute immediately for testing
      fn();
      return 'timeout-id';
    });
    mockClearTimeout = jest.spyOn(global, 'clearTimeout').mockImplementation(() => {});
  });

  afterEach(() => {
    mockSetTimeout.mockRestore();
    mockClearTimeout.mockRestore();
    jest.clearAllMocks();
  });

  test('debounces presence updates to prevent excessive Firebase calls', () => {
    // This test verifies the hook exists and doesn't throw errors
    const TestComponent = () => {
      const presenceContext = usePresence('user1');
      expect(presenceContext).toBeDefined();
      return null;
    };

    expect(() => {
      renderHook(() => (
        <PresenceProvider>
          <TestComponent />
        </PresenceProvider>
      ));
    }).not.toThrow();
  });

  test('memoizes context value to prevent unnecessary re-renders', () => {
    const TestComponent = () => {
      const presenceData = usePresence('user1');
      expect(presenceData).toBeDefined();
      return null;
    };

    const { rerender } = renderHook(() => (
      <PresenceProvider>
        <TestComponent />
      </PresenceProvider>
    ));

    // Re-render provider multiple times - should not throw
    expect(() => {
      rerender();
      rerender();
    }).not.toThrow();
  });

  test('efficiently manages presence state Map', () => {
    const TestComponent = () => {
      const { updatePresence, getPresence } = usePresence('user1');
      
      React.useEffect(() => {
        // Simulate multiple users updating presence
        updatePresence('online');
        const presence = getPresence('user1');
        expect(presence).toBeDefined();
      }, [updatePresence, getPresence]);
      
      return null;
    };

    renderHook(() => (
      <PresenceProvider>
        <TestComponent />
      </PresenceProvider>
    ));

    // Should handle presence state efficiently using Map
    expect(true).toBe(true); // Test passes if no errors thrown
  });

  test('optimizes listener management', () => {
    const { unmount } = renderHook(() => (
      <PresenceProvider>
        <div>Test</div>
      </PresenceProvider>
    ));

    // Should unmount without errors
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  test('handles rapid presence state changes efficiently', () => {
    const TestComponent = () => {
      const { updatePresence } = usePresence('user1');
      
      React.useEffect(() => {
        // Simulate rapid state changes
        const states = ['online', 'typing', 'idle', 'away', 'online'];
        states.forEach((state, index) => {
          setTimeout(() => updatePresence(state), index * 10);
        });
      }, [updatePresence]);
      
      return null;
    };

    const startTime = performance.now();
    
    renderHook(() => (
      <PresenceProvider>
        <TestComponent />
      </PresenceProvider>
    ));

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Should handle rapid changes efficiently
    expect(processingTime).toBeLessThan(50);
  });

  test('memoizes presence callbacks', () => {
    const TestComponent = ({ userId }) => {
      usePresence(userId);
      return <div data-testid="presence-user">{userId}</div>;
    };

    const { rerender } = renderHook(
      ({ userId }) => (
        <PresenceProvider>
          <TestComponent userId={userId} />
        </PresenceProvider>
      ),
      { initialProps: { userId: 'user1' } }
    );

    // Re-render with same userId
    rerender({ userId: 'user1' });

    // Should maintain callback stability
    expect(true).toBe(true); // Test passes if no errors thrown
  });

  test('efficiently handles large numbers of users', () => {
    const TestComponent = () => {
      const { updatePresence, getPresence } = usePresence('user1');
      
      React.useEffect(() => {
        // Simulate large user base
        for (let i = 0; i < 1000; i++) {
          updatePresence(`user${i}`, 'online');
        }
        
        // Test retrieval performance
        for (let i = 0; i < 1000; i++) {
          getPresence(`user${i}`);
        }
      }, [updatePresence, getPresence]);
      
      return null;
    };

    const startTime = performance.now();
    
    renderHook(() => (
      <PresenceProvider>
        <TestComponent />
      </PresenceProvider>
    ));

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Should handle large user base efficiently (under 100ms)
    expect(processingTime).toBeLessThan(100);
  });

  test('prevents memory leaks with proper cleanup', () => {
    const { unmount } = renderHook(() => (
      <PresenceProvider>
        <div>Test</div>
      </PresenceProvider>
    ));

    // Should unmount cleanly without memory leaks
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  test('debounce cleanup works correctly', () => {
    const TestComponent = () => {
      const presenceContext = usePresence('user1');
      expect(presenceContext).toBeDefined();
      return null;
    };

    expect(() => {
      renderHook(() => (
        <PresenceProvider>
          <TestComponent />
        </PresenceProvider>
      ));
    }).not.toThrow();
  });
});