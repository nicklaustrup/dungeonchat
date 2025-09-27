import React from 'react';
import { classifyMessageDiff } from '../utils/classifyMessageDiff';
import { logEvent } from './scrollDebugUtils';

/**
 * useScrollPrependRestoration
 * Captures scroll metrics before a pagination (loadMore) and restores scroll position after older messages are prepended.
 * Exposes classification info for upstream logic.
 *
 * @param {React.RefObject<HTMLElement>} containerRef
 * @param {Object} [options]
 * @param {number} [options.ignoreBottomFrames=2] number of animation frames to ignore bottom observer post-restoration
 * @returns {{ markBeforeLoadMore: (messages:Array)=>void, handleAfterMessages: (messages:Array)=>void, lastClassification: object|null, ignoreBottomRef: React.MutableRefObject<boolean> }}
 */
export function useScrollPrependRestoration(containerRef, { ignoreBottomFrames = 2 } = {}) {
  const beforeRef = React.useRef(null);
  const lastClassificationRef = React.useRef(null);
  const ignoreBottomRef = React.useRef(false);
  const ignoreFrameCountdownRef = React.useRef(0);
  const prevMessagesRef = React.useRef([]);

  const markBeforeLoadMore = React.useCallback((messages) => {
    const el = containerRef.current;
    if (!el) return;
    const firstId = messages?.[0]?.id;
    // Anchor element: we prefer the first currently rendered message so we can re-position precisely if height diff logic fails
    let anchorOffset = 0;
    if (firstId) {
      const node = el.querySelector(`[data-mid="${firstId}"]`);
      if (node) {
        const elBox = el.getBoundingClientRect();
        const nodeBox = node.getBoundingClientRect();
        anchorOffset = nodeBox.top - elBox.top; // distance from container top to first message top
      }
    }
    beforeRef.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      firstId,
      anchorOffset,
      timestamp: performance.now(),
    };
    prevMessagesRef.current = messages || [];
    logEvent('preload-mark', { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, firstId, anchorOffset });
  }, [containerRef]);

  const restoreIfNeeded = React.useCallback((classification) => {
    if (!classification) return;
    const { didPrepend, prependedCount, didAppend, reset } = classification;
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Restoration hook classification:', { didPrepend, prependedCount, didAppend, reset });
    }
    
    if (!didPrepend || didAppend || reset) {
      if (process.env.NODE_ENV === 'development' && (didAppend || reset)) {
        console.log('Restoration hook: skipping restore (append or reset detected)');
      }
      return; // only restore for pure prepend
    }
    const el = containerRef.current;
    if (!el || !beforeRef.current) return;
    const prev = beforeRef.current;
    const newScrollHeight = el.scrollHeight;
    const delta = newScrollHeight - prev.scrollHeight;
    let target = prev.scrollTop + delta;

    const applyScroll = (reason, extraLog = {}) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (target < 0) target = 0; // clamp
          el.scrollTop = target;
          ignoreBottomRef.current = true;
          el.__IGNORE_BOTTOM_ONCE__ = true;
          ignoreFrameCountdownRef.current = ignoreBottomFrames;
          logEvent('restoration', { delta, target, prependedCount, reason, ...extraLog });
        });
      });
    };

    // Primary positive-delta path (list grew as expected)
    if (delta > 0) {
      // Make sure we're calculating the correct scroll position
      // We want to maintain the visual position of existing content rather than jumping to the top
      const finalTarget = Math.min(target, el.scrollHeight - el.clientHeight);
      target = finalTarget > 0 ? finalTarget : target;
      
      applyScroll('delta-growth');
      return;
    }

    // Fallback: if delta is zero or negative, attempt anchor-based restoration using firstId position recorded earlier.
    const firstId = prev.firstId;
    const attemptAnchor = (phase) => {
      if (!firstId) return false;
      const node = el.querySelector(`[data-mid="${firstId}"]`);
      if (!node) return false;
      const elBox = el.getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      const currentOffset = nodeBox.top - elBox.top; // where the old first is now
      const desiredOffset = prev.anchorOffset != null ? prev.anchorOffset : currentOffset;
      const offsetDelta = currentOffset - desiredOffset;
      target = el.scrollTop + offsetDelta; // shift so anchor returns to previous visual offset
      applyScroll(phase === 'immediate' ? 'anchor-fallback' : 'anchor-fallback-deferred', { offsetDelta, currentOffset, desiredOffset, phase });
      return true;
    };

    // Try immediately (synchronous DOM state – may still reflect pre-update or partial update)
    if (attemptAnchor('immediate')) return;

    // Defer one frame to allow React to commit DOM for newly prepended nodes; then try again.
    requestAnimationFrame(() => {
      if (attemptAnchor('deferred')) return;
      // If we reach here, we cannot reliably restore; skip to avoid jarring negative jump.
      logEvent('restoration-skip', { delta, reason: 'nonpositive-delta-no-anchor', prependedCount, deferredTried: true });
    });
  }, [containerRef, ignoreBottomFrames]);

  React.useEffect(() => {
    if (!ignoreBottomRef.current) return;
    const raf = requestAnimationFrame(() => {
      ignoreFrameCountdownRef.current -= 1;
      if (ignoreFrameCountdownRef.current <= 0) {
        ignoreBottomRef.current = false;
        logEvent('restoration-bottom-guard-clear');
      }
    });
    return () => cancelAnimationFrame(raf);
  });

  const handleAfterMessages = React.useCallback((messages) => {
    const prev = prevMessagesRef.current;
    // Quick structural no-op check: same ref OR same length & same boundary IDs
    if (prev === messages) {
      return lastClassificationRef.current;
    }
    if (prev.length === messages.length && prev[0]?.id === messages[0]?.id && prev[prev.length - 1]?.id === messages[messages.length - 1]?.id) {
      // Deeper check: if id sets match, skip
      const prevLastClass = lastClassificationRef.current;
      let changed = false;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== messages[i].id) { changed = true; break; }
      }
      if (!changed) {
        return prevLastClass; // no reclassification needed
      }
    }
    const classification = classifyMessageDiff(prev, messages);
    lastClassificationRef.current = classification;
    logEvent('classification-v2', classification);
    restoreIfNeeded(classification);
    prevMessagesRef.current = messages;
    return classification;
  }, [restoreIfNeeded]);

  return {
    markBeforeLoadMore,
    handleAfterMessages,
    get lastClassification() { return lastClassificationRef.current; },
    ignoreBottomRef
  };
}

export default useScrollPrependRestoration;