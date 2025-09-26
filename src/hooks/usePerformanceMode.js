import { useCallback, useEffect, useState } from 'react';

/**
 * usePerformanceMode
 * Manages an optional performance / rendering optimization mode.
 * - Toggles root class `enable-content-visibility` (CSS opts messages into content-visibility)
 * - Persists preference in localStorage (key: perfModeEnabled)
 * - Exposes a global dev toggle helper `window.__togglePerformanceMode()` for quick manual testing
 */
export function usePerformanceMode() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('perfModeEnabled');
      return stored === '1';
    } catch {
      return false;
    }
  });

  // Apply root class when changed
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('enable-content-visibility', enabled);
    try { localStorage.setItem('perfModeEnabled', enabled ? '1' : '0'); } catch { /* ignore */ }
  }, [enabled]);

  const toggle = useCallback(() => setEnabled(e => !e), []);

  // Expose for manual toggling (non-production diagnostic helper)
  useEffect(() => {
    window.__togglePerformanceMode = toggle;
    return () => { if (window.__togglePerformanceMode === toggle) delete window.__togglePerformanceMode; };
  }, [toggle]);

  return { enabled, toggle, setEnabled };
}

export default usePerformanceMode;
