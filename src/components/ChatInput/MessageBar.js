import React from 'react';
import { FaPlus } from 'react-icons/fa6';
import { VscSmiley } from 'react-icons/vsc';

export function MessageBar({
  text,
  onChange,
  onKeyDown,
  onPickEmoji,
  onTriggerFile,
  emojiOpen,
  emojiButtonRef,
  textareaRef
}) {
  return (
    <div className="message-bar" role="group" aria-label="Message input">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const fileInput = e.target;
          const file = fileInput.files?.[0];
          if (file) onTriggerFile(file);
          // Allow selecting the same file again (mobile browsers often cache last selection)
          fileInput.value = '';
        }}
        style={{ display: 'none' }}
        id="image-upload"
      />
      <button
        type="button"
        className="bar-icon-btn"
        aria-label="Upload image"
        data-tip="Upload image"
        onClick={() => {
          const fileInput = document.getElementById('image-upload');
          if (fileInput) fileInput.click();
        }}
      >
        <FaPlus size={18} aria-hidden="true" />
      </button>
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
      <button
        type="button"
        ref={emojiButtonRef}
        className={`bar-icon-btn ${emojiOpen ? 'emoji-active' : ''}`}
        aria-label="Add emoji"
        data-tip="Add emoji"
        onClick={onPickEmoji}
      >
        <VscSmiley size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
