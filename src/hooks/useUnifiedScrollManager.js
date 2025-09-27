import React from 'react';
import { classifyMessageDiff } from '../utils/classifyMessageDiff';

/**
 * useUnifiedScrollManager - Combines auto-scroll, unread tracking, and pagination restoration
 * 
 * Replaces useAutoScrollV2 + useScrollPrependRestoration to eliminate conflicts.
 * 
 * Features:
 * - Auto-scroll when at bottom
 * - Unread message counting when scrolled up  
 * - Pagination scroll restoration for older messages
 * - Unified scroll position management
 * 
 * @param {Object} params
 * @param {React.RefObject<HTMLElement>} params.containerRef - scrollable container
 * @param {React.RefObject<HTMLElement>} params.anchorRef - bottom anchor element
 * @param {Array<any>} params.messages - message array (chronological order)
 * @param {number} [params.threshold=10] - px threshold to consider "at bottom"
 * @returns {Object} scroll management interface
 */
export function useUnifiedScrollManager({ containerRef, anchorRef, messages, threshold = 10 }) {
  // Core state
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  // Refs for change detection and restoration
  const prevMessagesRef = React.useRef([]);
  const isInitialLoadRef = React.useRef(true);
  const restorationDataRef = React.useRef(null);
  const ignoreBottomCheckRef = React.useRef(false);
  const ignoreFrameCountRef = React.useRef(0);
  
  // Utility functions
  const computeDistanceFromBottom = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    
    const { scrollTop, scrollHeight, clientHeight } = el;
    return Math.max(0, scrollHeight - (scrollTop + clientHeight));
  }, [containerRef]);
  
  const checkIfAtBottom = React.useCallback(() => {
    if (ignoreBottomCheckRef.current) return isAtBottom; // Don't update during restoration
    const distance = computeDistanceFromBottom();
    return distance <= threshold;
  }, [computeDistanceFromBottom, threshold, isAtBottom]);
  
  // Main scroll to bottom function
  const scrollToBottom = React.useCallback((behavior = 'smooth') => {
    const el = containerRef.current;
    const anchor = anchorRef.current;
    
    if (!el) return;
    
    if (anchor && behavior === 'smooth') {
      // Use smooth scrollIntoView when anchor is available
      anchor.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    } else {
      // Direct scroll assignment for instant scrolling
      el.scrollTop = el.scrollHeight;
    }
  }, [containerRef, anchorRef]);
  
  // Pagination restoration: capture state before loading older messages
  const captureBeforeLoadMore = React.useCallback(() => {
    const el = containerRef.current;
    if (!el || messages.length === 0) return;
    
    const firstMessage = messages[0];
    const firstId = firstMessage?.id;
    
    // Find anchor offset for precise restoration
    let anchorOffset = 0;
    if (firstId) {
      const node = el.querySelector(`[data-mid="${firstId}"]`);
      if (node) {
        const elBox = el.getBoundingClientRect();
        const nodeBox = node.getBoundingClientRect();
        anchorOffset = nodeBox.top - elBox.top;
      }
    }
    
    restorationDataRef.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      firstId,
      anchorOffset,
      timestamp: performance.now(),
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('UnifiedScroll: Captured restoration data', {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        firstId,
        anchorOffset
      });
    }
  }, [containerRef, messages]);
  
  // Pagination restoration: restore position after older messages are loaded
  const restoreScrollPosition = React.useCallback((classification) => {
    const el = containerRef.current;
    if (!el || !restorationDataRef.current || !classification) return;
    
    const { didPrepend, prependedCount, didAppend, reset } = classification;
    
    // Only restore for pure prepends (loading older messages)
    if (!didPrepend || didAppend || reset) {
      if (process.env.NODE_ENV === 'development') {
        console.log('UnifiedScroll: Skipping restoration (not pure prepend)', { didPrepend, didAppend, reset });
      }
      return;
    }
    
    const prev = restorationDataRef.current;
    const newScrollHeight = el.scrollHeight;
    const delta = newScrollHeight - prev.scrollHeight;
    
    if (delta > 0) {
      // Standard height-delta restoration
      const targetScrollTop = prev.scrollTop + delta;
      const clampedTarget = Math.max(0, Math.min(targetScrollTop, el.scrollHeight - el.clientHeight));
      
      ignoreBottomCheckRef.current = true;
      ignoreFrameCountRef.current = 3; // Ignore bottom checks for 3 animation frames
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = clampedTarget;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('UnifiedScroll: Restored via delta', {
              delta,
              targetScrollTop,
              clampedTarget,
              prependedCount
            });
          }
        });
      });
    } else {
      // Fallback: anchor-based restoration if delta is weird
      const { firstId, anchorOffset } = prev;
      if (firstId) {
        const node = el.querySelector(`[data-mid="${firstId}"]`);
        if (node) {
          const elBox = el.getBoundingClientRect();
          const nodeBox = node.getBoundingClientRect();
          const currentOffset = nodeBox.top - elBox.top;
          const adjustment = currentOffset - anchorOffset;
          
          if (Math.abs(adjustment) > 2) { // Only adjust if meaningful difference
            ignoreBottomCheckRef.current = true;
            ignoreFrameCountRef.current = 3;
            
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.scrollTop = Math.max(0, el.scrollTop - adjustment);
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('UnifiedScroll: Restored via anchor', {
                    firstId,
                    anchorOffset,
                    currentOffset,
                    adjustment
                  });
                }
              });
            });
          }
        }
      }
    }
    
    // Clear restoration data
    restorationDataRef.current = null;
  }, [containerRef]);
  
  // Handle scroll events for bottom detection
  const handleScroll = React.useCallback(() => {
    // Skip bottom detection during restoration cooldown
    if (ignoreFrameCountRef.current > 0) {
      ignoreFrameCountRef.current--;
      if (ignoreFrameCountRef.current === 0) {
        ignoreBottomCheckRef.current = false;
      }
      return;
    }
    
    const nowAtBottom = checkIfAtBottom();
    
    if (nowAtBottom !== isAtBottom) {
      setIsAtBottom(nowAtBottom);
      
      if (nowAtBottom) {
        // User scrolled back to bottom, clear unread count
        setUnreadCount(0);
      }
    }
  }, [checkIfAtBottom, isAtBottom]);
  
  // Main effect: handle message changes
  React.useEffect(() => {
    const currentMessages = messages || [];
    const prevMessages = prevMessagesRef.current;
    
    // Skip processing on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevMessagesRef.current = currentMessages;
      return;
    }
    
    // Classify the change
    const classification = classifyMessageDiff(prevMessages, currentMessages);
    const { didAppend, didPrepend, newMessages, appendedCount } = classification;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('UnifiedScroll: Message change classified', classification);
    }
    
    // Handle pagination restoration first
    if (didPrepend) {
      restoreScrollPosition(classification);
    }
    
    // Handle new messages (appends)
    if (didAppend && newMessages.length > 0) {
      if (isAtBottom) {
        // Auto-scroll to new messages
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
        });
      } else {
        // Add to unread count
        setUnreadCount(prev => prev + appendedCount);
      }
    }
    
    // Update previous messages
    prevMessagesRef.current = currentMessages;
  }, [messages, isAtBottom, restoreScrollPosition, scrollToBottom]);
  
  // Set up scroll event listener
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, handleScroll]);
  
  // Initialize bottom state
  React.useEffect(() => {
    const initialCheck = checkIfAtBottom();
    setIsAtBottom(initialCheck);
  }, [checkIfAtBottom]);
  
  return {
    // Auto-scroll interface (replaces useAutoScrollV2)
    isAtBottom,
    hasNewMessages: unreadCount > 0,
    newMessagesCount: unreadCount,
    scrollToBottom,
    
    // Pagination interface (replaces useScrollPrependRestoration)
    captureBeforeLoadMore,
    
    // Internal state for debugging
    _debug: {
      unreadCount,
      ignoreFrameCount: ignoreFrameCountRef.current,
      hasRestorationData: !!restorationDataRef.current
    }
  };
}