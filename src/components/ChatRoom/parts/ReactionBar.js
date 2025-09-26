import React from 'react';

export default function ReactionBar({ emojis, onReact, onReply, message, menuOpen, children }) {
  return (
    <div className={`reaction-buttons ${menuOpen ? 'force-visible' : ''}`} data-testid="reaction-bar">
      {emojis.map(emoji => (
        <button
          key={emoji}
          className="reaction-btn"
          data-tip={`React ${emoji}`}
          onClick={() => onReact && onReact(emoji)}
          aria-label={`React to message with ${emoji}`}
          data-testid="reaction-btn"
        >{emoji}</button>
      ))}
      {onReply && (
        <button
          className="reply-btn quote-reply-btn"
          data-tip="Reply"
          onClick={() => onReply(message)}
          aria-label="Reply to this message"
          data-testid="reply-btn"
        >❝</button>
      )}
      {children}
    </div>
  );
}
