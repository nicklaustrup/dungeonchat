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
      // Use smooth scrollIntoView when anchor is available, but ensure we reach true bottom
      anchor.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
      
      // Add a timeout to ensure we reach the true bottom after smooth scrolling
      setTimeout(() => {
        const targetTop = el.scrollHeight - el.clientHeight;
        if (Math.abs(el.scrollTop - targetTop) > 5) { // If we're not close enough to bottom
          el.scrollTop = Math.max(0, targetTop);
        }
        setIsAtBottom(true);
        setUnreadCount(0);
      }, 500); // Wait for smooth scroll to complete
    } else {
      // For instant/auto scrolling, use direct scroll assignment and ensure we're truly at bottom
      requestAnimationFrame(() => {
        const targetTop = el.scrollHeight - el.clientHeight;
        el.scrollTop = Math.max(0, targetTop);
        
        // Ensure we update the state after scroll
        requestAnimationFrame(() => {
          setIsAtBottom(true);
          setUnreadCount(0);
        });
      });
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
      // UnifiedScroll: Captured restoration data
    }
  }, [containerRef, messages]);
  
  // Pagination restoration: restore position after older messages are loaded
  const restoreScrollPosition = React.useCallback((classification) => {
    const el = containerRef.current;
    if (!el || !restorationDataRef.current || !classification) return;
    
    const { didPrepend, didAppend, reset } = classification;
    
    // Only restore for pure prepends (loading older messages)
    if (!didPrepend || didAppend || reset) {
      if (process.env.NODE_ENV === 'development') {
        // UnifiedScroll: Skipping restoration (not pure prepend)
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
            // UnifiedScroll: Restored via delta
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
                  // UnifiedScroll: Restored via anchor
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
    
    // Add debug logging in development
    if (process.env.NODE_ENV === 'development') {
      const el = containerRef.current;
      if (el) {
        const distance = computeDistanceFromBottom();
        console.log('UnifiedScroll: scroll event', { 
          nowAtBottom, 
          prevAtBottom: isAtBottom, 
          distance, 
          threshold,
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight
        });
      }
    }
    
    if (nowAtBottom !== isAtBottom) {
      setIsAtBottom(nowAtBottom);
      
      if (nowAtBottom) {
        // User scrolled back to bottom, clear unread count
        setUnreadCount(0);
        
        if (process.env.NODE_ENV === 'development') {
          // UnifiedScroll: cleared unread count - user at bottom
        }
      }
    }
  }, [checkIfAtBottom, isAtBottom, computeDistanceFromBottom, threshold, containerRef]);
  
  // Main effect: handle message changes
  React.useEffect(() => {
    const currentMessages = messages || [];
    const prevMessages = prevMessagesRef.current;
    
    if (process.env.NODE_ENV === 'development') {
      // UnifiedScroll: main effect running
    }
    
    // Handle initial load: scroll to bottom when messages first load
    if (isInitialLoadRef.current && currentMessages.length > 0) {
      isInitialLoadRef.current = false;
      prevMessagesRef.current = currentMessages;
      
      // Use multiple attempts with increasing delays to ensure scroll works
      const attemptScroll = (attempt = 0) => {
        if (attempt > 3) return; // Give up after 4 attempts
        
        setTimeout(() => {
          const el = containerRef.current;
          if (el) {
            // Use the same reliable scroll logic as the scroll button
            const targetTop = el.scrollHeight - el.clientHeight;
            el.scrollTop = Math.max(0, targetTop);
            
            // Verify we actually scrolled to bottom, if not try again
            requestAnimationFrame(() => {
              const actualDistance = el.scrollHeight - (el.scrollTop + el.clientHeight);
              if (actualDistance > 10 && attempt < 3) {
                attemptScroll(attempt + 1);
              } else {
                setIsAtBottom(true);
                setUnreadCount(0);
              }
            });
          }
        }, 50 + (attempt * 100)); // Increasing delays: 50ms, 150ms, 250ms, 350ms
      };
      
      attemptScroll();
      return;
    }
    
    // Skip processing if still initial load but no messages yet
    if (isInitialLoadRef.current) {
      return;
    }
    
    // Classify the change
    const classification = classifyMessageDiff(prevMessages, currentMessages);
    
    if (process.env.NODE_ENV === 'development') {
      // UnifiedScroll: classifying message diff
    }
    
    // Handle case where classification might be null/undefined
    if (!classification) {
      prevMessagesRef.current = currentMessages;
      return;
    }
    
    const { didAppend, didPrepend, appendedCount } = classification;
    
    if (process.env.NODE_ENV === 'development') {
      // UnifiedScroll: classification result
    }
    
    if (process.env.NODE_ENV === 'development') {
      // UnifiedScroll: Message change classified
    }
    
    // Handle pagination restoration first
    if (didPrepend) {
      restoreScrollPosition(classification);
    }
    
    // Handle new messages (appends)
    if (didAppend && appendedCount > 0) {
      // Force a fresh bottom check to ensure accuracy before making decisions
      const el = containerRef.current;
      let currentlyAtBottom = isAtBottom;
      
      if (el) {
        const distance = Math.max(0, el.scrollHeight - (el.scrollTop + el.clientHeight));
        currentlyAtBottom = distance <= threshold;
        
        // Update state immediately if it differs
        if (currentlyAtBottom !== isAtBottom) {
          setIsAtBottom(currentlyAtBottom);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        // UnifiedScroll: new message(s) detected
      }
      
      if (process.env.NODE_ENV === 'development') {
        // UnifiedScroll: checking auto-scroll condition
      }
      
      if (currentlyAtBottom) {
        if (process.env.NODE_ENV === 'development') {
          // UnifiedScroll: auto-scrolling to new messages
        }
        // Auto-scroll to new messages - use setTimeout for better test compatibility
        setTimeout(() => scrollToBottom('smooth'), 1);
      } else {
        // Add to unread count
        const newUnreadCount = unreadCount + appendedCount;
        setUnreadCount(newUnreadCount);
        
        if (process.env.NODE_ENV === 'development') {
          // UnifiedScroll: incrementing unread count
        }
      }
    }
    
    // Update previous messages
    prevMessagesRef.current = currentMessages;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isAtBottom, restoreScrollPosition, scrollToBottom, containerRef, threshold]);
  
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
    // Initial check should happen after container is set up
    requestAnimationFrame(() => {
      const initialCheck = checkIfAtBottom();
      setIsAtBottom(initialCheck);
    });
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