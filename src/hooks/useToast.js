import React from 'react';

// Very small toast hook; in real app could integrate a portal/UI component.
export function useToast() {
  const push = React.useCallback((message, opts = {}) => {
    const entry = { id: Date.now() + Math.random(), message, type: opts.type || 'info' };
    if (typeof window !== 'undefined') {
      window.__TEST_TOASTS__ && window.__TEST_TOASTS__.push(entry);
      // For now just log; placeholder for UI surface
      // eslint-disable-next-line no-console
      console.info('[toast]', entry.type, entry.message);
    }
    return entry.id;
  }, []);
  return { push };
}

export default useToast;
