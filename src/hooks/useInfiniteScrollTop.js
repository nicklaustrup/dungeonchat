import React from 'react';
import { logInfiniteTrigger, logScrollMetrics, logEvent } from './scrollDebugUtils';

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
export function useInfiniteScrollTop({ containerRef, hasMore, onLoadMore, threshold = 0, debounceMs = 150, cooldownMs = 600, enableFallback = true }) {
  const sentinelRef = React.useRef(null);
  const isFetchingRef = React.useRef(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const timeoutRef = React.useRef();
  const observerRef = React.useRef(null);
  const sentinelElRef = React.useRef(null);
  const loadCbRef = React.useRef(onLoadMore);
  const lastTriggerTsRef = React.useRef(0);
  const scrollListenerAttachedRef = React.useRef(false);

  // Keep latest callback without re-instantiating observer
  React.useEffect(() => { loadCbRef.current = onLoadMore; }, [onLoadMore]);

  const clearDebounce = (canceled = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      if (canceled && isFetchingRef.current) {
        // Reset fetching state if we cancel before execution
        isFetchingRef.current = false;
        setIsFetching(false);
        logEvent('infinite-cancelled');
      }
    }
  };

  React.useEffect(() => {
    // Capture container element for stable cleanup references (lint: react-hooks/exhaustive-deps guidance)
    const containerElForEffect = containerRef.current;
    if (!hasMore) {
      // Disconnect if no more pages
      if (observerRef.current) observerRef.current.disconnect();
      // Remove fallback listener if present
      if (scrollListenerAttachedRef.current && containerRef.current) {
        containerRef.current.removeEventListener('scroll', onScrollFallback, { passive: true });
        scrollListenerAttachedRef.current = false;
      }
      return;
    }
    const el = sentinelRef.current;
    if (!el) return;
    sentinelElRef.current = el;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (!hasMore) return;
      if (isFetchingRef.current) return; // prevent overlap
      // Only trigger if user is actually near the very top of the scroll container (avoid auto cascade on mount)
      const container = containerRef.current;
      if (container && container.scrollTop > 8) return;
      const now = Date.now();
      if (now - lastTriggerTsRef.current < cooldownMs) {
        return; // cooldown
      }
      logInfiniteTrigger({ event: 'intersect', fetching: isFetchingRef.current });
      isFetchingRef.current = true;
      setIsFetching(true);
      // Unobserve while fetching to prevent duplicate queueing
      try { observerRef.current && observerRef.current.unobserve(el); } catch (_) {}
      clearDebounce();
      timeoutRef.current = setTimeout(async () => {
        try {
          logInfiniteTrigger({ event: 'loadMore-start' });
          logScrollMetrics('before-loadMore', containerRef);
          lastTriggerTsRef.current = Date.now();
          await loadCbRef.current?.();
          logScrollMetrics('after-loadMore', containerRef);
        } finally {
          isFetchingRef.current = false;
          setIsFetching(false);
          logInfiniteTrigger({ event: 'loadMore-end' });
          // Re-observe if still has more
          if (hasMore && observerRef.current && sentinelElRef.current) {
            requestAnimationFrame(() => {
              try { observerRef.current.observe(sentinelElRef.current); } catch (_) {}
            });
          }
        }
      }, debounceMs);
    }, {
      root: containerRef.current || null,
      rootMargin: '0px 0px 0px 0px',
      threshold
    });
    observerRef.current.observe(el);

    // Fallback: scroll listener to detect top if IO misses (e.g., layout shifts or 0px sentinel quirks)
    function onScrollFallback() {
      if (!enableFallback) return;
      const elc = containerRef.current;
      if (!elc) return;
      if (!hasMore) return;
      if (isFetchingRef.current) return;
      if (elc.scrollTop > 2) return;
      const now = Date.now();
      if (now - lastTriggerTsRef.current < cooldownMs) return; // respect cooldown
      // Ensure not already debounced
      logInfiniteTrigger({ event: 'top-scroll-fallback' });
      isFetchingRef.current = true;
      setIsFetching(true);
      clearDebounce();
      try { observerRef.current && sentinelElRef.current && observerRef.current.unobserve(sentinelElRef.current); } catch (_) {}
      timeoutRef.current = setTimeout(async () => {
        try {
          logInfiniteTrigger({ event: 'loadMore-start' });
          logScrollMetrics('before-loadMore', containerRef);
          lastTriggerTsRef.current = Date.now();
          await loadCbRef.current?.();
          logScrollMetrics('after-loadMore', containerRef);
        } finally {
          isFetchingRef.current = false;
          setIsFetching(false);
          logInfiniteTrigger({ event: 'loadMore-end' });
          if (hasMore && observerRef.current && sentinelElRef.current) {
            requestAnimationFrame(() => {
              try { observerRef.current.observe(sentinelElRef.current); } catch (_) {}
            });
          }
        }
      }, debounceMs);
    }
    // Store ref to allow removal in cleanup
    const onScrollFallbackRef = onScrollFallback; // alias for closure
    // Attach once
    if (!scrollListenerAttachedRef.current && containerRef.current) {
      containerRef.current.addEventListener('scroll', onScrollFallbackRef, { passive: true });
      scrollListenerAttachedRef.current = true;
    }

    return () => {
      clearDebounce(true);
      observerRef.current && observerRef.current.disconnect();
      if (scrollListenerAttachedRef.current && containerElForEffect) {
        containerElForEffect.removeEventListener('scroll', onScrollFallbackRef, { passive: true });
        scrollListenerAttachedRef.current = false;
      }
    };
  }, [hasMore, threshold, debounceMs, containerRef, cooldownMs, enableFallback]);

  return { sentinelRef, isFetching };
}

export default useInfiniteScrollTop;