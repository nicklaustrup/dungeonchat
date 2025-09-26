import React from 'react';
import { createPortal } from 'react-dom';

export default function MessageOptionsMenu({
  open,
  menuPanelRef,
  menuMode,
  menuReady,
  menuStyle,
  quickMenuEmojis,
  addReaction,
  handleAddReactionFull,
  onReply,
  message,
  handleCopyText,
  canEdit,
  startEditing,
  canDelete,
  onDelete,
  text
}) {
  if (!open) return null;
  return createPortal(
    <div
      ref={menuPanelRef}
      className={`message-menu open mode-${menuMode} ${menuReady ? 'ready' : 'measuring'}`}
      role="menu"
      aria-label="Message options"
      onMouseDown={(e) => e.stopPropagation()}
      style={menuStyle}
      data-testid="message-options-menu"
    >
      <div className="menu-reactions-row" role="group" aria-label="Quick reactions">
        {quickMenuEmojis.map(r => (
          <button key={r} className="menu-reaction-btn" data-tip={`React ${r}`} onClick={() => { addReaction(r); }} aria-label={`React with ${r}`}>{r}</button>
        ))}
      </div>
      <div className="menu-divider" />
      <button role="menuitem" className="menu-item" onClick={handleAddReactionFull}>Add Reaction<span className="menu-item-icon" aria-hidden>+</span></button>
      {onReply && <button role="menuitem" className="menu-item" onClick={() => { onReply(message); }}>Reply<span className="menu-item-icon" aria-hidden>↩</span></button>}
      <button role="menuitem" className="menu-item" onClick={handleCopyText} disabled={!text}>Copy Text<span className="menu-item-icon" aria-hidden>⧉</span></button>
      {canEdit && (
        <button role="menuitem" onClick={startEditing} className="menu-item">Edit<span className="menu-item-icon" aria-hidden>✎</span></button>
      )}
      {canDelete && (
        <button role="menuitem" onClick={onDelete} className="menu-item delete-item">Delete<span className="menu-item-icon" aria-hidden>⌫</span></button>
      )}
    </div>,
    document.body
  );
}
