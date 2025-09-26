// Global Jest setup
import '@testing-library/jest-dom';

// Mock window.alert to avoid jsdom not implemented noise
if (!window.alert) {
  window.alert = (...args) => {
    // eslint-disable-next-line no-console
    console.warn('[alert mock]', ...args);
  };
} else {
  const original = window.alert;
  window.alert = (...args) => {
    console.warn('[alert mock]', ...args);
    try { original(...args); } catch (_) { /* swallow */ }
  };
}

// Simple toast collector for tests (will be used by toast hook mock)
window.__TEST_TOASTS__ = [];
