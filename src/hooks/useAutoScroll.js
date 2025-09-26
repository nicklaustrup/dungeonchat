import React from 'react';
import {
  logScrollMetrics,
  logMessageAppend,
  logClassification,
  logAutoDecision,
  logSuppressionChange
} from './scrollDebugUtils';

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
  const lastTreatReasonRef = React.useRef(null); // debug: why we considered an append read
  const prevLenRef = React.useRef(0);
  const initialRef = React.useRef(true);
  const prevLastIdRef = React.useRef(null);
  const prevFirstIdRef = React.useRef(null);
  const lastDistanceRef = React.useRef(0);
  const observerRef = React.useRef(null);
  const bottomVisibleRef = React.useRef(true);
  const lastTypeRef = React.useRef(null);
  const idSetRef = React.useRef(new Set());
  const prevNearBottomRef = React.useRef(true); // Whether user was near bottom before last append (hard or soft)
  const atBottomOnLastAppendRef = React.useRef(true); // Track if we were exactly at bottom when last append occurred (for read logic)
  const withinReadZoneRef = React.useRef(true); // broader zone (<= bottomThreshold) to count messages as read
  const lastScrollInfoRef = React.useRef({ time: 0, delta: 0, top: 0 }); // Last scroll movement metadata
  const suppressAutoRef = React.useRef(false); // Active suppression flag when user scrolls away to read

  const computeDistance = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return lastDistanceRef.current;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const dist = scrollHeight - (scrollTop + clientHeight);
    lastDistanceRef.current = dist;
    return dist;
  }, [containerRef]);

  const scrollToBottom = React.useCallback((behavior = 'smooth') => {
    // Primary: try anchor for accessibility (focus context / SR ordering)
    const anchorRun = () => {
      const node = anchorRef.current;
      if (node && typeof node.scrollIntoView === 'function') {
        try { node.scrollIntoView({ behavior, block: 'end' }); } catch(e) { /* noop */ }
      }
    };

    // Secondary: force hard mathematical bottom (accounts for padding / late layout shifts / extra elements below anchor)
    const hardBottomRun = () => {
      const el = containerRef.current;
      if (!el) return;
      const targetTop = Math.max(0, el.scrollHeight - el.clientHeight);
      if (typeof el.scrollTo === 'function') {
        try { el.scrollTo({ top: targetTop, behavior }); } catch(e) { el.scrollTop = targetTop; }
      } else {
        el.scrollTop = targetTop;
      }
      // Manually sync internal distance + state so button can disappear immediately even if no scroll event fires
      lastDistanceRef.current = el.scrollHeight - (el.scrollTop + el.clientHeight);
      const dist = lastDistanceRef.current;
      if (dist < 0) lastDistanceRef.current = 0; // clamp
      suppressAutoRef.current = false;
      prevNearBottomRef.current = true;
      atBottomOnLastAppendRef.current = true;
      withinReadZoneRef.current = true;
      setIsAtBottom(true);
      setNewCount(0);
    };

    // Orchestrate passes: anchor first (twice for rAF settle), then hard bottom enforcement passes.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      anchorRun();
      hardBottomRun();
    }));
    // Timed fallbacks to capture late content growth (images, variable fonts, etc.)
    [120, 400, 900].forEach(ms => {
      setTimeout(() => { anchorRun(); hardBottomRun(); }, ms);
    });
  }, [anchorRef, containerRef]);

  // Scroll listener
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let lastTop = el.scrollTop;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const dist = scrollHeight - (scrollTop + clientHeight);
      const delta = scrollTop - lastTop; // positive when scrolling down
      lastTop = scrollTop;
      // Hard bottom threshold: must be essentially at end to be considered fully at bottom.
      const hardBottomLimit = 8; // px
      // Soft proximity window for auto-scroll eligibility; keep prior logic but do not clear unread counters within it.
      const softBottomLimit = Math.min(bottomThreshold, 40); // narrower than previous to avoid misclassifying slight upward scrolls
  const atBottomHard = dist <= hardBottomLimit;
  const atBottomSoft = dist <= softBottomLimit; // used only for auto decision heuristics externally if needed later
  const withinReadZone = dist <= bottomThreshold; // spec: treat messages within threshold as already read
      // isAtBottom (public) now reflects hard bottom only
      const atBottom = atBottomHard;
      lastDistanceRef.current = dist;
      // Update recent scroll intent
      lastScrollInfoRef.current = { time: Date.now(), delta, top: scrollTop };
      // If user scrolled upwards recently (delta < 0) and moved beyond proximity window, mark suppress
      if (delta < 0) {
        const proximityPx = Math.max(200, (clientHeight || 0) * 0.25, bottomThreshold * 2, 180);
        if (dist > proximityPx) suppressAutoRef.current = true;
      } else if (atBottom) {
        // Reset suppression once user explicitly returns to bottom
        suppressAutoRef.current = false;
      }
      setIsAtBottom(atBottom);
      if (atBottomHard) {
        setNewCount(0);
        prevNearBottomRef.current = true; // strictly at hard bottom
        atBottomOnLastAppendRef.current = true; // mark for next append read classification
        withinReadZoneRef.current = true;
      } else {
        // "Near bottom" (for auto-scroll) still strict to avoid surprise jumps
        prevNearBottomRef.current = dist <= 12;
        // But maintain separate broader read zone state
        withinReadZoneRef.current = withinReadZone;
        // User has scrolled away from hard bottom; only revoke last-append-read flag if they exit read zone entirely
        if (!withinReadZone) {
          atBottomOnLastAppendRef.current = false;
        }
      }
      logScrollMetrics('scroll', containerRef, { dist, delta, atBottom, atBottomSoft, atBottomHard, withinReadZone, suppressed: suppressAutoRef.current });
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
          // Allow restoration hook to suppress a stale bottom signal
          const ignore = containerRef.current && containerRef.current.__IGNORE_BOTTOM_ONCE__;
          if (ignore) {
            // Clear the flag and skip
            delete containerRef.current.__IGNORE_BOTTOM_ONCE__;
            logScrollMetrics('bottom-intersect-ignored', containerRef);
            return;
          }
          computeDistance();
          setIsAtBottom(true);
          setNewCount(0);
          logScrollMetrics('bottom-intersect', containerRef, { viaObserver: true });
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
      prevNearBottomRef.current = true;
      atBottomOnLastAppendRef.current = true;
      logClassification({ phase: 'initial-hydrate', length });
      return;
    }

    if (length === prevLenRef.current) return; // no change

    const newFirstId = items[0]?.id || null;
    const newLast = items[length - 1];
    const newLastId = newLast?.id || null;
    const newLastType = newLast?.type || null;

    // Detect pagination (older messages prepended) when first id changes but last id is unchanged
  const paginationDetected = newFirstId !== prevFirstIdRef.current && newLastId === prevLastIdRef.current;

  // Capture previous length for logging clarity before updating ref
  const prevLenBefore = prevLenRef.current;
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

  logMessageAppend(items, prevLenBefore - appendedCount); // crude baseline call (prev length minus newly appended)

  logClassification({
    phase: 'length-change',
    length,
    prevLen: prevLenBefore,
    paginationDetected,
    appendedCount,
    wasNearBottom: prevNearBottomRef.current,
    isAtBottom,
    dist: lastDistanceRef.current
  });

    if (paginationDetected || appendedCount === 0) {
      // Pagination should not affect new message counters or read state.
      return;
    }

    const prevType = lastTypeRef.current;
    lastTypeRef.current = newLastType;
    const isImage = newLastType === 'image' || prevType === 'image';

    // Recompute distance now (post-layout) and again next frame to reduce race conditions
  const distNow = computeDistance();
  // New tighter proximity: only treat as auto-scroll eligible if truly at hard bottom (isAtBottom) or anchor visible.
  const proximityPx = 0; // legacy field retained for log shape compatibility (now unused for decision)
  const wasNearBottom = prevNearBottomRef.current; // state before append
  const recentScroll = Date.now() - lastScrollInfoRef.current.time < 400 && lastScrollInfoRef.current.delta < 0; // user scrolled up recently
  const userReading = suppressAutoRef.current || recentScroll;
  const isCloseRuntime = isAtBottom || bottomVisibleRef.current; // drop distance heuristic
  const shouldAuto = (wasNearBottom && isCloseRuntime) && !userReading; // must have been near bottom AND still at bottom context
    logAutoDecision({
      appendedCount,
      shouldAuto,
      wasNearBottom,
      isCloseRuntime,
      userReading,
      paginationDetected,
      distNow,
      proximityPx
    });

    const performScroll = () => {
      scrollToBottom('auto');
      if (isImage) {
        setTimeout(() => scrollToBottom('auto'), 300);
        setTimeout(() => scrollToBottom('auto'), 1000);
      }
    };

    if (shouldAuto) {
      // Delay slightly to allow DOM height settle (e.g., fonts/images). Capture intent.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        performScroll();
        prevNearBottomRef.current = true; // maintain near-bottom status
        atBottomOnLastAppendRef.current = true;
      }));
    } else {
      // Only increment unread count if user was not truly at bottom when messages arrived.
      // If they were at bottom (<= 2px) but suppression prevented auto-scroll, treat as read.
      const dist = lastDistanceRef.current;
      const inReadZone = dist <= bottomThreshold; // strict read zone (do not OR with prior ref)
      // Strict hard bottom: immediate physical bottom only (no carry-over flag)
      const wasHardBottom = dist <= 2;
      // Refined logic: Only treat as read if user is at physical hard bottom OR (not suppressed & within read zone)
      const treatAsRead = wasHardBottom || (!suppressAutoRef.current && inReadZone);
      if (!treatAsRead) {
        setNewCount(c => c + appendedCount);
        lastTreatReasonRef.current = null;
      } else {
        lastTreatReasonRef.current = wasHardBottom ? 'hard-bottom' : 'soft-zone-unsuppressed';
      }
      if (!suppressAutoRef.current) {
        suppressAutoRef.current = true; // lock until user returns bottom
        logSuppressionChange({ reason: 'user-away-on-append', appendedCount });
      }
      if (!inReadZone && !wasHardBottom) {
        atBottomOnLastAppendRef.current = false;
      }
      // Once user acknowledges (scrolls to bottom) suppression resets in scroll listener
    }
  }, [items, isAtBottom, scrollToBottom, bottomThreshold, containerRef, computeDistance]);

  // Expose a strict bottom concept (<=8px) if needed externally later
  // (Keeping API stable for now.)

  // Expose internal debug fields (read-only) via a stable symbol on the function (opt-in for tests)
  const debug = {
    _lastDistance: lastDistanceRef.current,
    _bottomVisible: bottomVisibleRef.current,
    _prevNearBottom: prevNearBottomRef.current,
    _atBottomOnLastAppend: atBottomOnLastAppendRef.current,
    _withinReadZone: withinReadZoneRef.current,
    _suppressed: suppressAutoRef.current,
    _lastScrollInfo: { ...lastScrollInfoRef.current },
    _idSetSize: idSetRef.current.size,
    _lastTreatAsRead: lastTreatReasonRef.current,
  };
  return { isAtBottom, hasNew: newCount > 0, newCount, scrollToBottom, __debug: debug };
}

export default useAutoScroll;