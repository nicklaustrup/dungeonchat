// useVirtualKeyboard
// Heuristic detection of on-screen keyboard on mobile to toggle a root class `keyboard-open`.
// We compare window.innerHeight against a baseline captured on mount, and if it shrinks
// by more than a threshold (default 150px) we assume the virtual keyboard is visible.
// Not perfect, but works across most mobile browsers without experimental APIs.
import { useEffect, useRef } from "react";

export function useVirtualKeyboard({ threshold = 150 } = {}) {
  const baseHeightRef = useRef(
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;
    const handleResize = () => {
      const current = window.innerHeight;
      const delta = baseHeightRef.current - current;
      const open = delta > threshold;
      root.classList.toggle("keyboard-open", open);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [threshold]);
}

export default useVirtualKeyboard;
