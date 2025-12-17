import React from "react";

function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null;
  const names = users.map((u) => u.displayName).join(", ");
  return (
    <div
      className="typing-indicator"
      aria-live="polite"
      aria-label={`${names} typing`}
    >
      <div className="typing-avatar">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <span className="typing-text">
        {names} {users.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
}

export default React.memo(TypingIndicator);
