import React from 'react';

/**
 * useAutoScroll
 * Consolidates scroll tracking, initial auto-scroll, and new message counting.
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLElement>} params.containerRef - scrollable container
 * @param {React.RefObject<HTMLElement>} params.anchorRef - element to scroll into view (bottom anchor)
 * @param {Array<any>} params.items - message array (chronological)
 * @param {number} [params.bottomThreshold=50] - px threshold to consider at bottom
 * @returns {{ isAtBottom: boolean, hasNew: boolean, newCount: number, scrollToBottom: (behavior?: ScrollBehavior)=>void }}
 */
export function useAutoScroll({ containerRef, anchorRef, items, bottomThreshold = 50 }) {
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [newCount, setNewCount] = React.useState(0);
  const prevLenRef = React.useRef(0);
  const initialRef = React.useRef(true);

  const scrollToBottom = React.useCallback((behavior = 'smooth') => {
    anchorRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, [anchorRef]);

  // Scroll listener
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const dist = scrollHeight - (scrollTop + clientHeight);
      const atBottom = dist < bottomThreshold;
      setIsAtBottom(atBottom);
      if (atBottom) setNewCount(0);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef, bottomThreshold]);

  // React to item length changes
  React.useEffect(() => {
    const length = items.length;
    if (!length) return;
    if (initialRef.current) {
      // initial mount
      scrollToBottom('auto');
      initialRef.current = false;
      prevLenRef.current = length;
      return;
    }
    if (length > prevLenRef.current) {
      const diff = length - prevLenRef.current;
      if (isAtBottom) {
        scrollToBottom('smooth');
      } else {
        setNewCount(c => c + diff);
      }
      prevLenRef.current = length;
    }
  }, [items, isAtBottom, scrollToBottom]);

  return { isAtBottom, hasNew: newCount > 0, newCount, scrollToBottom };
}

export default useAutoScroll;