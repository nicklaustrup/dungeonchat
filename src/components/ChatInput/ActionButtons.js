import React from 'react';
import { FaPlus, FaDiceD20 } from 'react-icons/fa6';
import { VscSmiley } from 'react-icons/vsc';
import './ActionButtons.css';

export function ActionButtons({
  onUploadImage,
  onToggleDice,
  onToggleEmoji,
  showDiceRoller = false,
  emojiOpen = false,
  emojiButtonRef
}) {
  return (
    <div className="action-buttons" role="toolbar" aria-label="Message actions">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const fileInput = e.target;
          const files = fileInput.files;
          if (files && files.length > 0) {
            onUploadImage(files);
          }
          // Allow selecting the same file again (mobile browsers often cache last selection)
          fileInput.value = '';
        }}
        style={{ display: 'none' }}
        id="image-upload"
      />
      
      <button
        type="button"
        className="action-btn"
        aria-label="Upload image"
        data-tip="Upload image"
        onClick={() => {
          const fileInput = document.getElementById('image-upload');
          if (fileInput) fileInput.click();
        }}
      >
        <FaPlus size={18} aria-hidden="true" />
      </button>
      
      <button
        type="button"
        className={`action-btn ${showDiceRoller ? 'dice-active' : ''}`}
        aria-label="Roll dice"
        data-tip="Roll dice"
        onClick={onToggleDice}
      >
        <FaDiceD20 size={18} aria-hidden="true" />
      </button>
      
      <button
        type="button"
        ref={emojiButtonRef}
        className={`action-btn ${emojiOpen ? 'emoji-active' : ''}`}
        aria-label="Add emoji"
        data-tip="Add emoji"
        onClick={onToggleEmoji}
      >
        <VscSmiley size={20} aria-hidden="true" />
      </button>
    </div>
  );
}