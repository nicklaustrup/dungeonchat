import React from "react";
import EmojiMenu from "../components/ChatInput/EmojiMenu";

export function useEmojiPicker() {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef(null);

  const onSelect = React.useRef(null);

  const openMenu = React.useCallback(() => {
    if (open) return;
    const anchorRect = buttonRef.current
      ? buttonRef.current.getBoundingClientRect()
      : null;
    EmojiMenu.open({
      anchorRect,
      onSelect: (emojiData) => {
        if (onSelect.current) onSelect.current(emojiData);
      },
      onClose: () => setOpen(false),
    });
    setOpen(true);
  }, [open]);

  const closeMenu = React.useCallback(() => {
    if (!open) return;
    // EmojiMenu handles outside click -> onClose already
    setOpen(false);
  }, [open]);

  const toggle = React.useCallback(() => {
    if (open) closeMenu();
    else openMenu();
  }, [open, closeMenu, openMenu]);

  const setOnSelect = React.useCallback((handler) => {
    onSelect.current = handler;
  }, []);

  return {
    open,
    toggle,
    buttonRef,
    setOnSelect,
  };
}
