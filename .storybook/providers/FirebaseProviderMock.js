import React from 'react';
import { FirebaseContext } from '../../src/services/FirebaseContext';

/**
 * Storybook-only mock provider that feeds the REAL application FirebaseContext
 * so calls to useFirebase() inside components receive this mock object.
 * This fixes prior mismatch where a separate context instance meant useFirebase() returned null.
 */
export function FirebaseProviderMock({ children }) {
  const value = React.useMemo(() => ({
    auth: { currentUser: { uid: 'user_current', email: 'me@example.com', displayName: 'You', photoURL: '' } },
    firestore: {},
    rtdb: {},
    storage: {},
    // noop stubs for auth helpers used in app (if any stories invoke them)
    signInWithPopup: async () => ({ user: { uid: 'user_current' } }),
    signOut: async () => {},
    GoogleAuthProvider: function MockProvider() {}
  }), []);
  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

// (No custom useFirebase export here; components use the real hook.)
