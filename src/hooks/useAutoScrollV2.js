import React from 'react';

/**
 * useAutoScrollV2 - Simplified auto-scroll and unread message hook
 * 
 * Replaces the complex 467-line useAutoScroll with a simple, predictable implementation.
 * 
 * Core Logic:
 * - Single 10px threshold for all decisions
 * - Simple state: AtBottom | ScrolledUp
 * - Clear behavior: At bottom = auto-scroll, Scrolled up = unread count
 * 
 * @param {Object} params
 * @param {React.RefObject<HTMLElement>} params.containerRef - scrollable container
 * @param {React.RefObject<HTMLElement>} params.anchorRef - element to scroll into view (bottom anchor)
 * @param {Array<any>} params.items - message array (chronological order)
 * @param {number} [params.threshold=10] - px threshold to consider "at bottom"
 * @returns {{ isAtBottom: boolean, hasNew: boolean, newCount: number, scrollToBottom: (behavior?: ScrollBehavior) => void }}
 */
export function useAutoScrollV2({ containerRef, anchorRef, items, threshold = 10 }) {
  // Simple state - no complex refs
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  // Track previous state for change detection
  const prevItemsLengthRef = React.useRef(0);
  const prevFirstIdRef = React.useRef(null);
  const prevLastIdRef = React.useRef(null);
  const isInitialLoadRef = React.useRef(true);
  
  // Compute distance from bottom
  const computeDistance = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    
    const { scrollTop, scrollHeight, clientHeight } = el;
    return Math.max(0, scrollHeight - (scrollTop + clientHeight));
  }, [containerRef]);
  
  // Check if user is at bottom
  const checkAtBottom = React.useCallback(() => {
    const distance = computeDistance();
    return distance <= threshold;
  }, [computeDistance, threshold]);
  
  // Scroll to bottom function
  const scrollToBottom = React.useCallback((behavior = 'smooth') => {
    const el = containerRef.current;
    const anchor = anchorRef.current;
    
    if (!el) return;
    
    // For 'auto' behavior (initial load), use direct scroll for reliability
    if (behavior === 'auto' || behavior === 'instant') {
      requestAnimationFrame(() => {
        const targetTop = Math.max(0, el.scrollHeight - el.clientHeight);
        el.scrollTop = targetTop;
        
        // Update state based on actual position after scroll
        requestAnimationFrame(() => {
          const actuallyAtBottom = checkAtBottom();
          setIsAtBottom(actuallyAtBottom);
          if (actuallyAtBottom) {
            setUnreadCount(0);
          }
        });
      });
      return;
    }
    
    // For smooth scrolling, try anchor first
    if (anchor && typeof anchor.scrollIntoView === 'function') {
      try {
        anchor.scrollIntoView({ behavior, block: 'end' });
      } catch (e) {
        // Fallback to manual scroll
      }
    }
    
    // Ensure we're truly at bottom
    requestAnimationFrame(() => {
      const targetTop = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTo({ top: targetTop, behavior });
      
      // Update state based on actual position after scroll
      requestAnimationFrame(() => {
        const actuallyAtBottom = checkAtBottom();
        setIsAtBottom(actuallyAtBottom);
        if (actuallyAtBottom) {
          setUnreadCount(0);
        }
      });
    });
  }, [containerRef, anchorRef, checkAtBottom]);
  
  // Handle scroll events
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    let rafId = null;
    
    const handleScroll = () => {
      // Skip scroll detection if restoration hook is temporarily ignoring
      if (el.__IGNORE_BOTTOM_ONCE__) {
        if (process.env.NODE_ENV === 'development') {
          console.log('V2 hook: ignoring scroll event (restoration flag set)');
        }
        el.__IGNORE_BOTTOM_ONCE__ = false; // reset flag
        return;
      }
      
      // Debounce with RAF for performance
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const atBottom = checkAtBottom();
        
        setIsAtBottom(atBottom);
        
        // Clear unread count when user returns to bottom
        if (atBottom) {
          setUnreadCount(0);
        }
      });
    };
    
    // Initial check
    handleScroll();
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [containerRef, checkAtBottom]);
  
  // Handle items changes (new messages or pagination)
  React.useEffect(() => {
    const currentLength = items.length;
    const currentFirstId = items[0]?.id || null;
    const currentLastId = items[currentLength - 1]?.id || null;
    
    // Skip if no items
    if (currentLength === 0) {
      return;
    }
    
    // Initial load - always scroll to bottom
    if (isInitialLoadRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('V2 hook: initial load detected, scrolling to bottom');
      }
      isInitialLoadRef.current = false;
      prevItemsLengthRef.current = currentLength;
      prevFirstIdRef.current = currentFirstId;
      prevLastIdRef.current = currentLastId;
      
      // Use auto behavior for initial load (instant)
      scrollToBottom('auto');
      return;
    }
    
    // No change in items
    if (currentLength === prevItemsLengthRef.current) {
      return;
    }
    
    const prevLength = prevItemsLengthRef.current;
    const prevFirstId = prevFirstIdRef.current;
    const prevLastId = prevLastIdRef.current;
    
    // Detect pagination: first ID changed but last ID same (older messages added)
    const isPagination = currentFirstId !== prevFirstId && currentLastId === prevLastId;
    
    // Detect new messages: last ID changed (newer messages added)
    const hasNewMessages = currentLastId !== prevLastId && currentLength > prevLength;
    
    // Update refs for next comparison
    prevItemsLengthRef.current = currentLength;
    prevFirstIdRef.current = currentFirstId;
    prevLastIdRef.current = currentLastId;
    
    if (isPagination) {
      // Pagination: don't affect auto-scroll or unread count
      // Scroll position should be maintained by useScrollPrependRestoration
      return;
    }
    
    if (hasNewMessages) {
      const newMessageCount = currentLength - prevLength;
      
      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('V2 hook: detected new messages', { newMessageCount, currentLastId, prevLastId });
      }
      
      // Check current position instead of relying on state
      const currentlyAtBottom = checkAtBottom();
      
      if (currentlyAtBottom) {
        // User at bottom: auto-scroll to show new messages
        if (process.env.NODE_ENV === 'development') {
          console.log('V2 hook: auto-scrolling to new messages');
        }
        scrollToBottom('auto');
      } else {
        // User scrolled up: increment unread count
        if (process.env.NODE_ENV === 'development') {
          console.log('V2 hook: incrementing unread count');
        }
        setUnreadCount(prev => prev + newMessageCount);
      }
    }
  }, [items, isAtBottom, scrollToBottom, checkAtBottom]);
  
  // Handle image loads - re-scroll if at bottom
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !isAtBottom) return;
    
    const images = el.querySelectorAll('img');
    
    const handleImageLoad = () => {
      if (checkAtBottom()) {
        scrollToBottom('auto');
      }
    };
    
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', handleImageLoad, { once: true });
      }
    });
    
    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
      });
    };
  }, [items, isAtBottom, checkAtBottom, scrollToBottom, containerRef]);
  
  return {
    isAtBottom,
    hasNew: unreadCount > 0,
    newCount: unreadCount,
    scrollToBottom
  };
}

export default useAutoScrollV2;