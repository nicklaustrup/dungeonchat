// Viewport & input modality detection hook
// Adds root-level classes used for mobile/performance tweaks without heavy runtime cost.
// Classes:
//  - mobile: width < 600px
//  - coarse-pointer: primary pointer is coarse (touch)
//  - short-vh: very short viewport height (landscape keyboards etc.)
//  - reduced-motion: user prefers reduced motion
// Also exposes a lightweight info object should a component need it (currently unused).
import { useEffect, useRef } from "react";

export function useViewportInfo() {
  const infoRef = useRef({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    coarse: false,
    reducedMotion: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return undefined;

    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const coarse = mqCoarse.matches;
      const reduced = mqReduced.matches;
      infoRef.current = { width: w, height: h, coarse, reducedMotion: reduced };
      root.classList.toggle("mobile", w < 600);
      root.classList.toggle("coarse-pointer", coarse);
      root.classList.toggle("short-vh", h < 540);
      root.classList.toggle("reduced-motion", reduced);
    };

    apply();
    window.addEventListener("resize", apply, { passive: true });
    window.addEventListener("orientationchange", apply, { passive: true });
    mqCoarse.addEventListener
      ? mqCoarse.addEventListener("change", apply)
      : mqCoarse.addListener(apply);
    mqReduced.addEventListener
      ? mqReduced.addEventListener("change", apply)
      : mqReduced.addListener(apply);

    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      mqCoarse.removeEventListener
        ? mqCoarse.removeEventListener("change", apply)
        : mqCoarse.removeListener(apply);
      mqReduced.removeEventListener
        ? mqReduced.removeEventListener("change", apply)
        : mqReduced.removeListener(apply);
    };
  }, []);

  return infoRef; // currently unused externally, returned for potential future consumers
}

export default useViewportInfo;
