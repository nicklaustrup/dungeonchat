import React from "react";

export function MessageBar({ text, onChange, onKeyDown, textareaRef }) {
  return (
    <div className="message-bar" role="group" aria-label="Message input">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Send a message"
        className="message-input"
        aria-label="Message text"
        rows={1}
        spellCheck={true}
      />
    </div>
  );
}
