import React from 'react';

/**
 * useMenuToggle
 * Manages open/close state for a popover / menu with outside click & Escape handling.
 * Returns refs for trigger & menu plus convenience handlers.
 */
export function useMenuToggle({ initialOpen = false } = {}) {
  const [open, setOpen] = React.useState(initialOpen);
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const close = React.useCallback(() => setOpen(false), []);
  const toggle = React.useCallback(() => setOpen(o => !o), []);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!menu) return;
      if (menu.contains(e.target) || trigger?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, close]);

  return { open, setOpen, toggle, close, triggerRef, menuRef };
}

export default useMenuToggle;
