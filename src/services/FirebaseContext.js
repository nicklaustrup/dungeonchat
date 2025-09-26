import React, { createContext, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, rtdb, storage, signInWithPopup, signOut, GoogleAuthProvider } from './firebase';

// Export the context so Storybook/tests can mock via <FirebaseContext.Provider />
export const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
  const [user] = useAuthState(auth);

  const value = {
    auth,
    firestore,
    rtdb,
    storage,
    user,
    signInWithPopup,
    signOut,
    GoogleAuthProvider
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
