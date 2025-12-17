import React from "react";

/**
 * useTruncationObserver
 * Tracks a collection of elements and toggles data-truncated when scrollWidth > clientWidth.
 * Uses ResizeObserver when available plus window resize fallback.
 */
export function useTruncationObserver() {
  const elementsRef = React.useRef(new Set());

  const compute = React.useCallback(() => {
    elementsRef.current.forEach((el) => {
      if (!el) return;
      const truncated = el.scrollWidth > el.clientWidth;
      if (truncated) el.setAttribute("data-truncated", "true");
      else el.removeAttribute("data-truncated");
    });
  }, []);

  const register = React.useCallback(
    (el) => {
      if (el) {
        elementsRef.current.add(el);
        compute();
      }
    },
    [compute]
  );

  React.useEffect(() => {
    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    }
    const ro = new ResizeObserver(() => compute());
    elementsRef.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [compute]);

  return { register, recompute: compute };
}

export default useTruncationObserver;
