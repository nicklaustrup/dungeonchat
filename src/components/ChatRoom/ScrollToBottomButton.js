import React, { useEffect, useState, useRef } from "react";
import { LuArrowDownToLine } from "react-icons/lu";

// Adds fade / slide in-out animation. Keeps the button mounted during exit
// so the disappear animation can play before removal.
function ScrollToBottomButton({ visible, hasNew, newCount, onClick }) {
  const btnRef = useRef(null); // ref must be declared before effects using it
  const transitioningOut = useRef(false);
  const [render, setRender] = useState(visible); // controls mounting
  const [show, setShow] = useState(false); // controls visible vs hiding class

  useEffect(() => {
    if (visible) {
      // If becoming visible, ensure rendered then next frame mark show
      if (!render) setRender(true);
      requestAnimationFrame(() => setShow(true));
      transitioningOut.current = false;
    } else if (render) {
      // Trigger hide animation
      setShow(false);
      transitioningOut.current = true;
    }
  }, [visible, render]);

  const handleTransitionEnd = (e) => {
    if (e.propertyName === "opacity" && transitioningOut.current && !show) {
      setRender(false); // unmount after fade-out completes
      transitioningOut.current = false;
    }
  };

  // If we are about to hide and the button is focused, shift focus to the log region to avoid aria-hidden focus conflict
  useEffect(() => {
    if (!visible && document.activeElement === btnRef.current) {
      const log = document.querySelector("[role=\"log\"]");
      if (log) {
        log.focus?.();
      } else {
        // Fallback: blur the button on mobile to clear focus state
        btnRef.current?.blur();
      }
    }
  }, [visible]);

  if (!render) return null;

  const label = hasNew
    ? `${newCount} new message${newCount > 1 ? "s" : ""}`
    : "Scroll to bottom";
  const handleClick = () => {
    onClick();
    // On mobile devices, blur the button after a short delay to clear focus/active state
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setTimeout(() => {
        btnRef.current?.blur();
      }, 300);
    }
  };

  const classes = [
    "scroll-to-bottom-btn",
    show ? "is-visible" : "is-hiding",
    hasNew && show ? "new" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={btnRef}
      type="button"
      className={classes}
      onClick={handleClick}
      onTransitionEnd={handleTransitionEnd}
      aria-label={hasNew ? "Scroll to latest new messages" : "Scroll to bottom"}
      tabIndex={show ? 0 : -1}
    >
      <span className="scroll-icon-wrapper" aria-hidden="true">
        <LuArrowDownToLine size={20} />
      </span>
      <span className="scroll-label">{label}</span>
    </button>
  );
}

export default React.memo(ScrollToBottomButton);
