import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker from 'emoji-picker-react';

/**
 * EmojiMenu (portal-based floating picker)
 * Usage: EmojiMenu.open({ anchorRect: DOMRect, onSelect: (emoji) => {}, onClose: () => {} })
 * This singleton component dynamically mounts itself once and repositions relative to an anchor.
 */

let externalOpen; // will hold the open method after first mount
let mountNode; // singleton mount node in document.body

function EmojiMenuSingleton() {
  const [state, setState] = useState({ visible: false, anchorRect: null, onSelect: null, onClose: null });
  const panelRef = useRef(null);

  const close = useCallback(() => {
    setState(s => ({ ...s, visible: false }));
    if (state.onClose) state.onClose();
  }, [state.onClose]);

  const open = useCallback((opts) => {
    setState({
      visible: true,
      anchorRect: opts.anchorRect || null,
      onSelect: opts.onSelect || null,
      onClose: opts.onClose || null
    });
  }, []);

  // Expose globally
  useEffect(() => { externalOpen = open; }, [open]);

  // Close on escape / outside click
  useEffect(() => {
    if (!state.visible) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const onPointer = (e) => {
      const panel = panelRef.current;
      if (panel && !panel.contains(e.target)) close();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, [state.visible, close]);

  if (!state.visible) return null;

  // Compute position near anchor
  let style = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  if (state.anchorRect) {
    const { top, left, bottom } = state.anchorRect;
    const gap = 6;
    style = {
      top: Math.round(bottom + gap),
      left: Math.round(left),
      position: 'fixed'
    };
  }

  return createPortal(
    <div ref={panelRef} className="emoji-picker-portal" style={{ position: 'fixed', zIndex: 1600, ...style }}>
      <EmojiPicker
        onEmojiClick={(emojiData) => {
          if (state.onSelect) state.onSelect(emojiData);
          close();
        }}
        autoFocusSearch={true}
      />
    </div>,
    mountNode
  );
}

export function EmojiMenuProvider() {
  // Ensure mount node
  if (!mountNode) {
    mountNode = document.createElement('div');
    mountNode.id = 'emoji-menu-root';
    document.body.appendChild(mountNode);
  }
  return <EmojiMenuSingleton />;
}

/** Imperative open helper */
EmojiMenuSingleton.open = (options) => {
  if (externalOpen) externalOpen(options);
  else {
    // mount node may not be ready yet; queue microtask
    setTimeout(() => externalOpen && externalOpen(options), 0);
  }
};

export const EmojiMenu = {
  open: (options) => EmojiMenuSingleton.open(options)
};

export default EmojiMenu;