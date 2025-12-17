import React from "react";
import { FaPlus, FaDiceD20, FaQuestion } from "react-icons/fa6";
import { VscSmiley } from "react-icons/vsc";
import "./ActionButtons.css";

export function ActionButtons({
  onUploadImage,
  onToggleDice,
  onToggleEmoji,
  onToggleHelp,
  showDiceRoller = false,
  showCommandsHelp = false,
  emojiOpen = false,
  emojiButtonRef,
  campaignId = null,
  hasCharacter = false,
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
          fileInput.value = "";
        }}
        style={{ display: "none" }}
        id="image-upload"
      />

      <button
        type="button"
        className="action-btn"
        aria-label="Upload image"
        data-tip="Upload image"
        onClick={() => {
          const fileInput = document.getElementById("image-upload");
          if (fileInput) fileInput.click();
        }}
      >
        <FaPlus size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`action-btn ${showDiceRoller ? "dice-active" : ""}`}
        aria-label="Roll dice"
        data-tip="Roll dice"
        onClick={onToggleDice}
      >
        <FaDiceD20 size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        ref={emojiButtonRef}
        className={`action-btn ${emojiOpen ? "emoji-active" : ""}`}
        aria-label="Add emoji"
        data-tip="Add emoji"
        onClick={onToggleEmoji}
      >
        <VscSmiley size={20} aria-hidden="true" />
      </button>

      {campaignId && (
        <button
          type="button"
          className={`action-btn help-btn ${showCommandsHelp ? "help-active" : ""} ${hasCharacter ? "has-character" : ""}`}
          aria-label={
            hasCharacter
              ? "Character commands help"
              : "Commands help (create character for more)"
          }
          data-tip={hasCharacter ? "Character commands help" : "Commands help"}
          onClick={onToggleHelp}
        >
          <FaQuestion size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
