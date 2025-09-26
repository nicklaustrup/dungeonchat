import React from 'react';

// Simple telemetry bus (Phase 5 groundwork)
const telemetryQueue = [];
export function logTelemetry(event) {
  telemetryQueue.push({ ts: Date.now(), ...event });
  if (telemetryQueue.length > 50) telemetryQueue.shift();
}
export function getTelemetrySnapshot() { return [...telemetryQueue]; }

export default function ReactionBar({ emojis, onReact, onReply, message, menuOpen, children, hidden }) {
  const longPressTimeout = React.useRef(null);
  const longPressActive = React.useRef(false);

  const handlePointerDown = (emoji, e) => {
    if (e.pointerType === 'mouse') return; // focus on touch only
    longPressActive.current = false;
    longPressTimeout.current = setTimeout(() => {
      longPressActive.current = true;
      // For long-press, treat as primary reaction toggle
      if (onReact) onReact(emoji);
      logTelemetry({ type: 'long-press-reaction', emoji, messageId: message?.id });
    }, 420); // 420ms threshold
  };

  const clearLongPress = (emoji, triggerClick, e) => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    if (!longPressActive.current && triggerClick && onReact) {
      onReact(emoji);
      logTelemetry({ type: 'tap-reaction', emoji, messageId: message?.id });
    }
  };

  const isTouch = React.useMemo(() => matchMedia('(hover: none) and (pointer: coarse)').matches, []);
  const effectiveHidden = hidden && !(isTouch && menuOpen); // allow menuOpen (selected) to show on touch
  return (
    <div
      className={`reaction-buttons ${menuOpen ? 'force-visible' : ''} ${effectiveHidden ? 'hidden-collapsed' : ''}`}
      data-testid="reaction-bar"
      aria-hidden={effectiveHidden || undefined}
    >
      {emojis.map(emoji => (
        <button
          key={emoji}
          className="reaction-btn"
          data-tip={`React ${emoji}`}
          onClick={() => {
            // Desktop / mouse path or keyboard activation (Enter/Space -> click)
            if (longPressActive.current) return; // already handled by long press
            if (onReact) onReact(emoji);
            logTelemetry({ type: 'click-reaction', emoji, messageId: message?.id });
          }}
          onPointerDown={(e) => handlePointerDown(emoji, e)}
          onPointerUp={(e) => clearLongPress(emoji, true, e)}
          onPointerLeave={(e) => clearLongPress(emoji, false, e)}
          aria-label={`React to message with ${emoji}`}
          data-testid="reaction-btn"
        >{emoji}</button>
      ))}
      {onReply && (
        <button
          className="reply-btn quote-reply-btn"
          data-tip="Reply"
          onClick={() => { onReply(message); logTelemetry({ type: 'reply', messageId: message?.id }); }}
          aria-label="Reply to this message"
          data-testid="reply-btn"
        >❝</button>
      )}
      {children}
    </div>
  );
}
