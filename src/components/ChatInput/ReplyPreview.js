import React from "react";

export function ReplyPreview({ replyingTo, onCancel, onJump }) {
  if (!replyingTo) return null;
  return (
    <div className="reply-preview compact">
      <button
        type="button"
        className="reply-preview-label only"
        onClick={() => onJump && replyingTo.id && onJump(replyingTo.id)}
        aria-label={`Jump to original message from ${replyingTo.displayName}`}
        title={`Jump to original message from ${replyingTo.displayName}`}
      >
        Replying to {replyingTo.displayName}
      </button>
      <button
        className="reply-preview-close tiny"
        onClick={onCancel}
        type="button"
        aria-label="Cancel reply"
        title="Cancel reply"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}
