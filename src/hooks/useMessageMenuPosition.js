import React from "react";

/**
 * Handles positioning and lifecycle for a floating message menu.
 * Extracted from ChatMessage for modularity & easier testing.
 */
export function useMessageMenuPosition({
  menuOpen,
  onClose,
  showDeleteConfirm,
}) {
  const menuRef = React.useRef(null); // wrapper with trigger
  const menuPanelRef = React.useRef(null); // actual menu panel
  const [menuMode, setMenuMode] = React.useState("down");
  const [menuStyle, setMenuStyle] = React.useState({});
  const [menuReady, setMenuReady] = React.useState(false);

  const computeMenuPosition = React.useCallback(() => {
    if (!menuOpen) return;
    const wrapper = menuRef.current;
    const panel = menuPanelRef.current;
    if (!wrapper || !panel) return;
    const triggerBtn = wrapper.querySelector(".message-menu-trigger");
    const triggerRect = triggerBtn
      ? triggerBtn.getBoundingClientRect()
      : wrapper.getBoundingClientRect();
    const messageEl = wrapper.closest(".message");
    const messageRect = messageEl
      ? messageEl.getBoundingClientRect()
      : triggerRect;
    const panelHeight = panel.offsetHeight || panel.scrollHeight || 200;
    const panelWidth = panel.offsetWidth || 240;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Try side placement first
    const sideGap = 8;
    let sideLeft = messageRect.right + sideGap;
    const sideFits = sideLeft + panelWidth + 8 <= viewportW;
    let top;
    if (sideFits) {
      let t = Math.min(
        Math.max(messageRect.top, 8),
        Math.max(8, viewportH - panelHeight - 8)
      );
      setMenuMode("side");
      setMenuStyle({ top: Math.round(t), left: Math.round(sideLeft) });
      setMenuReady(true);
      return;
    }

    // Vertical placement fallback
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportH - triggerRect.bottom;
    const needed = panelHeight + 16;
    let mode = "down";
    if (spaceBelow >= needed) mode = "down";
    else if (spaceAbove >= needed) mode = "up";
    else mode = "middle";
    if (mode === "down") top = triggerRect.bottom + 4;
    else if (mode === "up")
      top = Math.max(8, triggerRect.top - panelHeight - 4);
    else top = Math.max(8, (viewportH - panelHeight) / 2);
    let left = triggerRect.right - panelWidth;
    left = Math.min(left, viewportW - panelWidth - 8);
    left = Math.max(8, left);
    setMenuMode(mode);
    setMenuStyle((prev) => {
      const next = { top: Math.round(top), left: Math.round(left) };
      if (prev.top === next.top && prev.left === next.left) return prev;
      return next;
    });
    setMenuReady(true);
    // Edge shift class for narrow screens to reduce off-canvas risk
    const nearHorizontalEdge =
      triggerRect.left < 24 || viewportW - triggerRect.right < 24;
    panel.classList.toggle("edge-shift", nearHorizontalEdge);
  }, [menuOpen]);

  // Manage body class when any menu open
  React.useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("chat-menu-open");
    } else {
      const stillOpen = document.querySelector(".message-menu.open");
      if (!stillOpen) document.body.classList.remove("chat-menu-open");
    }
    return () => {
      const stillOpen = document.querySelector(".message-menu.open");
      if (!stillOpen) document.body.classList.remove("chat-menu-open");
    };
  }, [menuOpen]);

  // Outside click & escape
  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e) => {
      if (showDeleteConfirm) return;
      const wrap = menuRef.current;
      const panel = menuPanelRef.current;
      if (!wrap) return;
      const insideTrigger = wrap.contains(e.target);
      const insidePanel = panel && panel.contains(e.target);
      if (insideTrigger || insidePanel) return;
      onClose?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [menuOpen, onClose, showDeleteConfirm]);

  // Initial measurement
  React.useLayoutEffect(() => {
    if (!menuOpen) return;
    setMenuReady(false);
    const raf = requestAnimationFrame(computeMenuPosition);
    return () => cancelAnimationFrame(raf);
  }, [menuOpen, computeMenuPosition]);

  // Respond to resize / scroll
  React.useEffect(() => {
    if (!menuOpen) return;
    const raf = requestAnimationFrame(computeMenuPosition);
    window.addEventListener("resize", computeMenuPosition);
    window.addEventListener("scroll", computeMenuPosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", computeMenuPosition);
      window.removeEventListener("scroll", computeMenuPosition, true);
    };
  }, [menuOpen, computeMenuPosition]);

  // Fallback safeguard
  React.useEffect(() => {
    if (!menuOpen) return;
    const t = setTimeout(() => {
      setMenuReady((r) => {
        if (!r) {
          setMenuMode("down");
          setMenuStyle((s) => ({ top: s.top ?? 100, left: s.left ?? 100 }));
          return true;
        }
        return r;
      });
    }, 120);
    return () => clearTimeout(t);
  }, [menuOpen]);

  return { menuRef, menuPanelRef, menuMode, menuStyle, menuReady };
}

export default useMessageMenuPosition;
