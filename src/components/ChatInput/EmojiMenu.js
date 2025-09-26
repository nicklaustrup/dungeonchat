import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
// Dynamic loader for emoji-picker-react to defer large bundle cost until first open
let EmojiPickerMod = null;
async function loadEmojiPicker() {
  if (!EmojiPickerMod) {
    EmojiPickerMod = await import('emoji-picker-react');
  }
  return EmojiPickerMod.default || EmojiPickerMod.EmojiPicker || EmojiPickerMod;
}

/**
 * EmojiMenu (portal-based floating picker)
 * Usage: EmojiMenu.open({ anchorRect: DOMRect, onSelect: (emoji) => {}, onClose: () => {} })
 * This singleton component dynamically mounts itself once and repositions relative to an anchor.
 */

let externalOpen; // will hold the open method after first mount
let mountNode; // singleton mount node in document.body

function EmojiMenuSingleton() {
  const [state, setState] = useState({ visible: false, anchorRect: null, onSelect: null, onClose: null });
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState(null);
  // Hooks for dynamic picker module (declared unconditionally to satisfy rules-of-hooks)
  const [pickerReady, setPickerReady] = useState(false);
  const PickerRef = useRef(null);
  // Kick off load when panel becomes visible first time
  useEffect(() => {
    if (!state.visible) return; // do not load until needed
    let active = true;
    loadEmojiPicker().then(Mod => { if (active) { PickerRef.current = Mod; setPickerReady(true); } });
    return () => { active = false; };
  }, [state.visible]);

  const close = useCallback(() => {
    setState(s => ({ ...s, visible: false }));
    const latest = stateRef.current;
    if (latest.onClose) latest.onClose();
  }, []);

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

  // Position calculation after render so we know panel size
  useEffect(() => {
    if (!state.visible) { setPanelStyle(null); return; }
    if (!panelRef.current || !state.anchorRect) return;
    const gap = 6;
    const anchor = state.anchorRect;
    const panelRect = panelRef.current.getBoundingClientRect();
    // Determine bounding container (try main chat area or app root)
    const appContainer = document.querySelector('.App section') || document.querySelector('.App') || document.body;
    const bounds = appContainer.getBoundingClientRect();
    // Preferred: above the anchor
    let top = anchor.top - panelRect.height - gap;
    let placeAbove = true;
    if (top < bounds.top + 4) {
      top = anchor.bottom + gap; // fallback below
      placeAbove = false;
    }
    let left = anchor.left;
    if (left + panelRect.width > bounds.right - 4) left = bounds.right - panelRect.width - 4;
    if (left < bounds.left + 4) left = bounds.left + 4;
    // Prevent going below container bottom; if so, force above if possible
    if (!placeAbove && top + panelRect.height > bounds.bottom - 4) {
      const retryTop = anchor.top - panelRect.height - gap;
      if (retryTop >= bounds.top + 4) {
        top = retryTop;
        placeAbove = true;
      }
    }
    setPanelStyle({ top: Math.round(top), left: Math.round(left), position: 'fixed', transform: 'none', '--emoji-placement': placeAbove ? 'above' : 'below' });
  }, [state.visible, state.anchorRect]);

  // Theme detection
  const theme = (() => {
    // Prefer explicit light-theme class on body or root
    const isLight = document.body.classList.contains('light-theme') || document.querySelector('.App.light-theme');
    return isLight ? 'light' : 'dark';
  })();

  if (!state.visible) return null;

  // If panelStyle not yet calculated, provide a conservative initial style.
  // On mobile (coarse pointer) the virtual keyboard can shrink viewport height causing bottom overflow.
  // We place it centered horizontally and 20% from top as a safer default until measured.
  let fallbackStyle;
  if (state.anchorRect) {
    fallbackStyle = { position: 'fixed', top: Math.min(window.innerHeight - 300, state.anchorRect.bottom + 8), left: state.anchorRect.left, opacity: 0 };
  } else {
    fallbackStyle = { position: 'fixed', top: Math.round(window.innerHeight * 0.2), left: '50%', transform: 'translateX(-50%)', opacity: 0 };
  }
  const style = panelStyle || fallbackStyle;

  const PickerComp = PickerRef.current;

  return createPortal(
    <div ref={panelRef} className="emoji-picker-portal" style={{ zIndex: 1600, ...style }}>
      {pickerReady && PickerComp ? (
        <PickerComp
          onEmojiClick={(emojiData) => {
            if (state.onSelect) state.onSelect(emojiData);
            close();
          }}
          autoFocusSearch={true}
          theme={theme}
        />
      ) : (
        <div style={{ padding: '32px 48px', fontSize: 12, opacity: 0.8 }}>Loading emoji…</div>
      )}
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