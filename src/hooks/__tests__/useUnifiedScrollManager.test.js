import { renderHook, act } from '@testing-library/react';
import { useUnifiedScrollManager } from '../useUnifiedScrollManager';

// Mock classifyMessageDiff
jest.mock('../../utils/classifyMessageDiff', () => ({
  classifyMessageDiff: jest.fn(() => ({
    didAppend: false,
    didPrepend: false,
    newMessages: [],
    appendedCount: 0,
    reset: false
  }))
}));

// Helper to create mock container element
function createMockContainer({ scrollTop = 0, scrollHeight = 1000, clientHeight = 400 } = {}) {
  const el = document.createElement('div');
  
  // Mock scroll properties
  Object.defineProperty(el, 'scrollTop', {
    get: () => el._scrollTop ?? scrollTop,
    set: (v) => { 
      el._scrollTop = v;
    }
  });
  Object.defineProperty(el, 'scrollHeight', { 
    get: () => el._scrollHeight ?? scrollHeight,
    set: (v) => { el._scrollHeight = v; }
  });
  Object.defineProperty(el, 'clientHeight', { 
    get: () => el._clientHeight ?? clientHeight 
  });

  // Mock querySelector for pagination restoration
  el.querySelector = jest.fn((selector) => {
    if (selector.includes('data-mid')) {
      const mockNode = document.createElement('div');
      mockNode.getBoundingClientRect = () => ({
        top: 100,
        left: 0,
        width: 200,
        height: 50
      });
      return mockNode;
    }
    return null;
  });

  // Mock getBoundingClientRect
  el.getBoundingClientRect = () => ({
    top: 50,
    left: 0,
    width: 400,
    height: 400
  });

  // Mock addEventListener/removeEventListener
  el.addEventListener = jest.fn();
  el.removeEventListener = jest.fn();

  return el;
}

// Mock anchor element
function createMockAnchor() {
  const el = document.createElement('div');
  el.scrollIntoView = jest.fn();
  return el;
}

describe('useUnifiedScrollManager', () => {
  let containerRef, anchorRef, mockContainer, mockAnchor;

  beforeEach(() => {
    mockContainer = createMockContainer();
    mockAnchor = createMockAnchor();
    containerRef = { current: mockContainer };
    anchorRef = { current: mockAnchor };

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup RAF
    global.requestAnimationFrame = jest.fn((cb) => cb());
    global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages: [],
          threshold: 10
        })
      );

      expect(result.current.hasNewMessages).toBe(false);
      expect(result.current.newMessagesCount).toBe(0);
      expect(typeof result.current.scrollToBottom).toBe('function');
      expect(typeof result.current.captureBeforeLoadMore).toBe('function');
    });

    it('should set up scroll event listener', () => {
      renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages: [],
          threshold: 10
        })
      );

      expect(mockContainer.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('scroll to bottom functionality', () => {
    it('should scroll using anchor when behavior is smooth', async () => {
      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages: [],
        })
      );

      await act(async () => {
        result.current.scrollToBottom('smooth');
      });

      expect(mockAnchor.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    });

    it('should scroll directly when behavior is not smooth', async () => {
      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages: [],
        })
      );

      await act(async () => {
        result.current.scrollToBottom('auto');
      });

      // Should scroll to the proper bottom position (scrollHeight - clientHeight)
      const expectedScrollTop = mockContainer.scrollHeight - mockContainer.clientHeight;
      expect(mockContainer.scrollTop).toBe(expectedScrollTop);
    });
  });

  describe('pagination functionality', () => {
    it('should capture state before load more', async () => {
      const messages = [
        { id: '1', text: 'Message 1' },
        { id: '2', text: 'Message 2' }
      ];

      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages,
        })
      );

      await act(async () => {
        result.current.captureBeforeLoadMore();
      });

      expect(mockContainer.querySelector).toHaveBeenCalledWith('[data-mid="1"]');
    });
  });

  describe('edge cases', () => {
    it('should handle null container ref gracefully', () => {
      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef: { current: null },
          anchorRef,
          messages: [],
        })
      );

      expect(result.current.hasNewMessages).toBe(false);
      expect(() => result.current.scrollToBottom()).not.toThrow();
      expect(() => result.current.captureBeforeLoadMore()).not.toThrow();
    });

    it('should handle empty messages array', () => {
      const { result } = renderHook(() =>
        useUnifiedScrollManager({
          containerRef,
          anchorRef,
          messages: [],
        })
      );

      expect(result.current.hasNewMessages).toBe(false);
    });
  });
});