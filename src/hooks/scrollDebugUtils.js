/**
 * Debug utility for auto-scroll behavior
 * Add this to useAutoScroll hook for debugging
 */

let debugEnabled = false;
let captureToWindow = true;

/**
 * Enable / disable scroll debug instrumentation
 * @param {boolean} enabled
 * @param {Object} [opts]
 * @param {boolean} [opts.capture=true] also push structured events to window.__SCROLL_TRACE__
 */
export const enableScrollDebug = (enabled = true, opts = {}) => {
  debugEnabled = enabled;
  if (typeof opts.capture === "boolean") captureToWindow = opts.capture;
  if (enabled && captureToWindow && typeof window !== "undefined") {
    window.__SCROLL_TRACE__ = window.__SCROLL_TRACE__ || [];
  }
};

// Style tag for console logs (preserved for future use if logs are re-enabled)
// const styleTag = 'background:#222;color:#6cf;padding:2px 4px;border-radius:3px;font-size:11px;';

const pushTrace = (event) => {
  if (!debugEnabled || !captureToWindow || typeof window === "undefined")
    return;
  try {
    window.__SCROLL_TRACE__.push({ t: Date.now(), ...event });
    // eslint-disable-next-line no-empty
  } catch (_) {}
};

export const logEvent = (label, data = {}) => {
  // Only log if debugEnabled or SCROLL_DEBUG env is set (never in test/CI)
  const shouldLog =
    debugEnabled ||
    (typeof process !== "undefined" && process.env && process.env.SCROLL_DEBUG);
  if (!shouldLog) return;
  // Comment out console logs to reduce test output noise
  // eslint-disable-next-line no-console
  // console.log('%c[ScrollDbg]', styleTag, label, data);
  pushTrace({ label, ...data });
};

export const logScrollMetrics = (label, containerRef, extra = {}) => {
  if (!debugEnabled || !containerRef?.current) return;
  const el = containerRef.current;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
  const payload = {
    scrollTop,
    scrollHeight,
    clientHeight,
    distanceFromBottom,
    isAtBottom: distanceFromBottom <= 4,
    dynamicThreshold: Math.max(50, clientHeight * 0.25),
    ...extra,
  };
  logEvent(label, payload);
};

export const logMessageAppend = (items, prevLength) => {
  if (!debugEnabled) return;
  const newCount = items.length - prevLength;
  if (newCount > 0) {
    logEvent("append", {
      count: newCount,
      lastIds: items.slice(-Math.min(newCount, 5)).map((m) => m.id),
    });
  }
};

export const logClassification = (info) => {
  logEvent("classification", info);
};

export const logInfiniteTrigger = (info) => {
  logEvent("infinite-trigger", info);
};

export const logAutoDecision = (info) => {
  logEvent("auto-decision", info);
};

export const logSuppressionChange = (info) => {
  logEvent("suppression", info);
};

export const dumpScrollTrace = () =>
  typeof window !== "undefined" ? window.__SCROLL_TRACE__ : [];

// Global exposure for easy console use in development
if (typeof window !== "undefined") {
  window.__SCROLL_DEBUG__ = window.__SCROLL_DEBUG__ || {
    enable: (on = true, opts) => enableScrollDebug(on, opts),
    dump: () => dumpScrollTrace(),
    events: () => (window.__SCROLL_TRACE__ || []).slice(),
    clear: () => {
      if (window.__SCROLL_TRACE__) window.__SCROLL_TRACE__.length = 0;
    },
  };

  window.scrolldebug = window.__SCROLL_DEBUG__;

  // Optional: auto-enable if env flag injected at build time
  if (process.env.REACT_APP_SCROLL_DEBUG === "1") {
    try {
      enableScrollDebug(true);
    } catch (_) {
      /* noop */
    }
  }
}

// Usage in useAutoScroll.js:
// import { logScrollMetrics, logMessageAppend } from './scrollDebugUtils';
//
// // In scroll listener:
// logScrollMetrics('Scroll Event', containerRef);
//
// // In items effect:
// logMessageAppend(items, prevLenRef.current);
