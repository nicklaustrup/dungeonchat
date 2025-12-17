import React from "react";

// Simple telemetry bus (Phase 5 groundwork)
const telemetryQueue = [];
export function logTelemetry(event) {
  telemetryQueue.push({ ts: Date.now(), ...event });
  if (telemetryQueue.length > 50) telemetryQueue.shift();
}
export function getTelemetrySnapshot() {
  return [...telemetryQueue];
}

export default function ReactionBar({
  emojis,
  onReact,
  onReply,
  message,
  menuOpen,
  children,
  hidden,
}) {
  const longPressTimeout = React.useRef(null);
  const longPressActive = React.useRef(false);
  const pointerHandled = React.useRef(false); // Track if pointer events handled the reaction
  const lastReactionTime = React.useRef({}); // Track last reaction time per emoji
  const lastMenuOpenState = React.useRef(menuOpen);

  // Clear debounce state when menuOpen changes from true to false (deselection)
  React.useEffect(() => {
    if (lastMenuOpenState.current && !menuOpen) {
      // Message was deselected - clear debounce state to allow immediate reactions on next selection
      lastReactionTime.current = {};
    }
    lastMenuOpenState.current = menuOpen;
  }, [menuOpen]);

  const handlePointerDown = (emoji, e) => {
    if (e.pointerType === "mouse") return; // focus on touch only
    longPressActive.current = false;
    pointerHandled.current = false; // Reset flag at start of interaction
    longPressTimeout.current = setTimeout(() => {
      longPressActive.current = true;

      // Debounce rapid long presses on the same emoji for the same message (300ms window)
      const now = Date.now();
      const debounceKey = `${message?.id}-${emoji}`;
      const lastTime = lastReactionTime.current[debounceKey] || 0;
      if (now - lastTime < 300) {
        console.log(
          "Debouncing rapid long press on",
          emoji,
          "for message",
          message?.id
        );
        return;
      }

      lastReactionTime.current[debounceKey] = now;
      pointerHandled.current = true; // Mark as handled by pointer events
      // For long-press, treat as primary reaction toggle
      if (onReact) onReact(emoji);
      logTelemetry({
        type: "long-press-reaction",
        emoji,
        messageId: message?.id,
      });
    }, 420); // 420ms threshold
  };

  const clearLongPress = (emoji, triggerClick, e) => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    // Only trigger reaction on pointer up for touch devices, not mouse/pen
    if (
      !longPressActive.current &&
      triggerClick &&
      e.pointerType !== "mouse" &&
      onReact
    ) {
      // Debounce rapid taps on the same emoji for the same message (300ms window)
      const now = Date.now();
      const debounceKey = `${message?.id}-${emoji}`;
      const lastTime = lastReactionTime.current[debounceKey] || 0;
      if (now - lastTime < 300) {
        console.log(
          "Debouncing rapid tap on",
          emoji,
          "for message",
          message?.id
        );
        return;
      }

      lastReactionTime.current[debounceKey] = now;
      pointerHandled.current = true; // Mark as handled by pointer events
      onReact(emoji);
      logTelemetry({ type: "tap-reaction", emoji, messageId: message?.id });
    }
  };

  const effectiveHidden = hidden && !menuOpen; // Simplified: menuOpen already includes touch+selected logic from parent
  return (
    <div
      className={`reaction-buttons ${menuOpen ? "force-visible" : ""} ${effectiveHidden ? "hidden-collapsed" : ""}`}
      data-testid="reaction-bar"
      aria-hidden={effectiveHidden || undefined}
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          className="reaction-btn"
          data-tip={`React ${emoji}`}
          onClick={() => {
            // Desktop / mouse path or keyboard activation (Enter/Space -> click)
            if (longPressActive.current || pointerHandled.current) return; // already handled by long press or pointer events

            // Debounce rapid clicks on the same emoji for the same message (300ms window)
            const now = Date.now();
            const debounceKey = `${message?.id}-${emoji}`;
            const lastTime = lastReactionTime.current[debounceKey] || 0;
            if (now - lastTime < 300) {
              console.log(
                "Debouncing rapid click on",
                emoji,
                "for message",
                message?.id
              );
              return;
            }

            lastReactionTime.current[debounceKey] = now;
            if (onReact) onReact(emoji);
            logTelemetry({
              type: "click-reaction",
              emoji,
              messageId: message?.id,
            });
          }}
          onPointerDown={(e) => handlePointerDown(emoji, e)}
          onPointerUp={(e) => clearLongPress(emoji, true, e)}
          onPointerLeave={(e) => clearLongPress(emoji, false, e)}
          aria-label={`React to message with ${emoji}`}
          data-testid="reaction-btn"
        >
          {emoji}
        </button>
      ))}
      {onReply && (
        <button
          className="reply-btn quote-reply-btn"
          data-tip="Reply"
          onClick={() => {
            onReply(message);
            logTelemetry({ type: "reply", messageId: message?.id });
          }}
          aria-label="Reply to this message"
          data-testid="reply-btn"
        >
          ❝
        </button>
      )}
      {children}
    </div>
  );
}
