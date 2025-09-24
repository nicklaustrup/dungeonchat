/**
 * Debug utility for auto-scroll behavior
 * Add this to useAutoScroll hook for debugging
 */

let debugEnabled = false;

export const enableScrollDebug = (enabled = true) => {
  debugEnabled = enabled;
};

export const logScrollMetrics = (label, containerRef) => {
  if (!debugEnabled || !containerRef?.current) return;
  
  const el = containerRef.current;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
  
  console.group(`🔍 Scroll Debug: ${label}`);
  console.log('📏 Metrics:', {
    scrollTop,
    scrollHeight,
    clientHeight,
    distanceFromBottom,
    isAtBottom: distanceFromBottom <= 4,
    dynamicThreshold: Math.max(50, clientHeight * 0.25)
  });
  console.groupEnd();
};

export const logMessageAppend = (items, prevLength) => {
  if (!debugEnabled) return;
  
  const newCount = items.length - prevLength;
  if (newCount > 0) {
    console.group(`📨 New Messages: +${newCount}`);
    const newMessages = items.slice(-newCount);
    newMessages.forEach((msg, i) => {
      console.log(`${i + 1}.`, {
        id: msg.id,
        type: msg.type,
        text: msg.text?.substring(0, 50) + (msg.text?.length > 50 ? '...' : ''),
        hasImage: !!msg.imageURL
      });
    });
    console.groupEnd();
  }
};

// Usage in useAutoScroll.js:
// import { logScrollMetrics, logMessageAppend } from './scrollDebugUtils';
// 
// // In scroll listener:
// logScrollMetrics('Scroll Event', containerRef);
//
// // In items effect:
// logMessageAppend(items, prevLenRef.current);