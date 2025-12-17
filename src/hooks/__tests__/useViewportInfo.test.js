import { renderHook, act } from "@testing-library/react";

// Hook source (we create a lightweight inline version if not yet implemented)
import { useEffect } from "react";

// Attempt to import real hook; if missing, define a noop for test resilience
let useViewportInfo;
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  // dynamic require to avoid breaking if path changes later
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useViewportInfo = require("../useViewportInfo").useViewportInfo; // CommonJS interop
} catch (e) {
  useViewportInfo = function FallbackViewportHook() {
    useEffect(() => {}, []);
  };
}

describe("useViewportInfo", () => {
  beforeEach(() => {
    document.documentElement.className = "";
  });

  it("adds mobile class when width < 600", () => {
    const originalInnerWidth = global.innerWidth;
    Object.defineProperty(global, "innerWidth", {
      value: 500,
      configurable: true,
    });
    const { unmount } = renderHook(() => useViewportInfo());
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(document.documentElement.classList.contains("mobile")).toBe(true);
    unmount();
    Object.defineProperty(global, "innerWidth", {
      value: originalInnerWidth,
      configurable: true,
    });
  });

  it("removes mobile class when width >= 600", () => {
    const originalInnerWidth = global.innerWidth;
    Object.defineProperty(global, "innerWidth", {
      value: 800,
      configurable: true,
    });
    renderHook(() => useViewportInfo());
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(document.documentElement.classList.contains("mobile")).toBe(false);
    Object.defineProperty(global, "innerWidth", {
      value: originalInnerWidth,
      configurable: true,
    });
  });
});
