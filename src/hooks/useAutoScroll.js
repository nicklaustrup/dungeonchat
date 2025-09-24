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
  const prevLastIdRef = React.useRef(null);
  const prevFirstIdRef = React.useRef(null);
  const lastDistanceRef = React.useRef(0);
  const observerRef = React.useRef(null);
  const bottomVisibleRef = React.useRef(true);
  const lastTypeRef = React.useRef(null);
  const idSetRef = React.useRef(new Set());

  const computeDistance = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return lastDistanceRef.current;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const dist = scrollHeight - (scrollTop + clientHeight);
    lastDistanceRef.current = dist;
    return dist;
  }, [containerRef]);

  const scrollToBottom = React.useCallback((behavior = 'smooth') => {
    const run = () => anchorRef.current?.scrollIntoView({ behavior, block: 'end' });
    requestAnimationFrame(() => requestAnimationFrame(run));
    // Fallback passes for late-loading content (images, fonts)
    setTimeout(run, 120);
    setTimeout(run, 400);
    setTimeout(run, 900);
  }, [anchorRef]);

  // Scroll listener
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const dist = scrollHeight - (scrollTop + clientHeight);
      // Relax bottom detection slightly to account for fractional pixels & async content growth
      const atBottom = dist <= bottomThreshold + 4;
      lastDistanceRef.current = dist;
      setIsAtBottom(atBottom);
      if (atBottom) setNewCount(0);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef, bottomThreshold]);

  // IntersectionObserver as a more robust bottom detection (in case of async layout shifts)
  React.useEffect(() => {
    if (!anchorRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        bottomVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          computeDistance();
          setIsAtBottom(true);
          setNewCount(0);
        }
      });
    }, { root: containerRef.current, threshold: [0, 0.01, 0.1] });
    observerRef.current.observe(anchorRef.current);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [anchorRef, containerRef, computeDistance]);

  // Attach image load handler to re-scroll if at bottom or near bottom when they finish loading
  React.useEffect(() => {
    if (!containerRef.current) return;
    const root = containerRef.current;
    const imgs = root.querySelectorAll('img');
    if (!imgs.length) return;
    const handler = () => {
      const dist = computeDistance();
      const proximityPx = Math.max(200, root.clientHeight * 0.25);
      if (isAtBottom || bottomVisibleRef.current || dist <= proximityPx) {
        scrollToBottom('auto');
      }
    };
    imgs.forEach(img => {
      if (!img.complete) img.addEventListener('load', handler, { once: true });
    });
    return () => imgs.forEach(img => img.removeEventListener('load', handler));
  }, [items, isAtBottom, scrollToBottom, computeDistance, containerRef]);

  // React to item length changes
  React.useEffect(() => {
    const length = items.length;
    if (!length) return;
    if (initialRef.current) {
      scrollToBottom('auto');
      initialRef.current = false;
      prevLenRef.current = length;
      prevLastIdRef.current = items[length - 1]?.id || null;
      prevFirstIdRef.current = items[0]?.id || null;
      lastTypeRef.current = items[length - 1]?.type || null;
      idSetRef.current = new Set(items.map(m => m.id));
      return;
    }

    if (length === prevLenRef.current) return; // no change

    const newFirstId = items[0]?.id || null;
    const newLast = items[length - 1];
    const newLastId = newLast?.id || null;
    const newLastType = newLast?.type || null;

    // Detect pagination (older messages prepended) when first id changes but last id is unchanged
    const paginationDetected = newFirstId !== prevFirstIdRef.current && newLastId === prevLastIdRef.current;

    // Update refs for future comparisons early
    prevLenRef.current = length;
    prevLastIdRef.current = newLastId;
    prevFirstIdRef.current = newFirstId;

    // Build appended ID list (new messages that appeared at tail)
    let appendedCount = 0;
    if (!paginationDetected) {
      // Walk backwards until we find a previously known id
      for (let i = length - 1; i >= 0; i--) {
        const id = items[i]?.id;
        if (!idSetRef.current.has(id)) {
          appendedCount++;
        } else {
          break;
        }
      }
    }

    // Refresh known IDs set
    idSetRef.current = new Set(items.map(m => m.id));

    if (paginationDetected || appendedCount === 0) return; // do nothing for pagination

    const prevType = lastTypeRef.current;
    lastTypeRef.current = newLastType;
    const isImage = newLastType === 'image' || prevType === 'image';

    // Recompute distance now (post-layout) and again next frame to reduce race conditions
    const distNow = computeDistance();
    const proximityPx = Math.max(200, (containerRef.current?.clientHeight || 0) * 0.25, bottomThreshold * 2, 180);
    const isClose = isAtBottom || bottomVisibleRef.current || distNow <= proximityPx;

    const performScroll = () => {
      scrollToBottom('auto');
      if (isImage) {
        setTimeout(() => scrollToBottom('auto'), 300);
        setTimeout(() => scrollToBottom('auto'), 1000);
      }
    };

    if (isClose) {
      // Delay slightly to allow DOM height settle (e.g., fonts/images)
      requestAnimationFrame(() => requestAnimationFrame(performScroll));
    } else {
      setNewCount(c => c + appendedCount);
    }
  }, [items, isAtBottom, scrollToBottom, bottomThreshold, containerRef, computeDistance]);

  return { isAtBottom, hasNew: newCount > 0, newCount, scrollToBottom };
}

export default useAutoScroll;