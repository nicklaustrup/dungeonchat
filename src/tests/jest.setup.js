// Global Jest setup
import '@testing-library/jest-dom';
import React from 'react';
import { configure } from '@testing-library/react';

// Configure testing library to use our global wrapper
configure({
  wrapper: ({ children }) => {
    // Import dynamically to avoid circular dependencies
    const { ProfanityFilterProvider } = require('../contexts/ProfanityFilterContext');
    return React.createElement(ProfanityFilterProvider, {}, children);
  }
});

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

// Mock Firebase Firestore functions to prevent errors
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(() => ({ id: 'mock-collection' })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  serverTimestamp: jest.fn(() => ({ isEqual: () => false }))
}));

// Mock Firebase Context
jest.mock('../services/FirebaseContext', () => ({
  useFirebase: () => ({
    firestore: {},
    auth: { currentUser: { uid: 'test-user', displayName: 'Test User' } },
    user: { uid: 'test-user', displayName: 'Test User' },
    rtdb: {},
    storage: {}
  })
}));
