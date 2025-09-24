import React from 'react';

/**
 * useInfiniteScrollTop
 * Observes a top sentinel element to trigger loading older items when it becomes visible.
 * Intended for chat-style lists where older content loads when user scrolls to top.
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLElement>} params.containerRef - Scroll container (required for rootMargin calculations if needed)
 * @param {boolean} params.hasMore - Whether more data can be loaded
 * @param {Function} params.onLoadMore - Callback to invoke when sentinel intersects
 * @param {number} [params.threshold=0] - Intersection threshold
 * @param {number} [params.debounceMs=150] - Debounce delay between triggers
 * @returns {{ sentinelRef: React.RefObject<HTMLDivElement>, isFetching: boolean }}
 */
export function useInfiniteScrollTop({ containerRef, hasMore, onLoadMore, threshold = 0, debounceMs = 150 }) {
  const sentinelRef = React.useRef(null);
  const isFetchingRef = React.useRef(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const timeoutRef = React.useRef();

  const clearDebounce = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  React.useEffect(() => {
    if (!hasMore) return; // no observer if nothing more to load
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (!hasMore) return;
      if (isFetchingRef.current) return; // prevent overlap

      isFetchingRef.current = true;
      setIsFetching(true);
      // Debounce actual load to avoid rapid multiple triggers
      clearDebounce();
      timeoutRef.current = setTimeout(async () => {
        try {
          await onLoadMore?.();
        } finally {
          isFetchingRef.current = false;
          setIsFetching(false);
        }
      }, debounceMs);
    }, {
      root: containerRef.current || null,
      rootMargin: '0px 0px 0px 0px',
      threshold
    });

    observer.observe(el);
    return () => {
      clearDebounce();
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, threshold, debounceMs, containerRef]);

  return { sentinelRef, isFetching };
}

export default useInfiniteScrollTop;