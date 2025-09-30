import React from 'react';
import { FirebaseContext } from '../../src/services/FirebaseContext';

/**
 * Enhanced Storybook mock provider that feeds the REAL application FirebaseContext
 * with support for enhanced user profiles and additional Firebase services.
 * Includes mock user profile data for testing profile components.
 */
export function FirebaseProviderMock({ 
  children, 
  mockUser = null, 
  mockProfile = null,
  loading = false 
}) {
  // Default mock user
  const defaultUser = {
    uid: 'user_current',
    email: 'demo@example.com',
    displayName: 'Demo User',
    photoURL: 'https://via.placeholder.com/150x150?text=DU',
    emailVerified: true,
    providerData: [{ providerId: 'google.com' }]
  };

  // Default mock profile for testing
  const defaultProfile = {
    uid: 'user_current',
    username: '',
    displayName: 'Demo User',
    email: 'demo@example.com',
    bio: '',
    statusMessage: '',
    profilePictureURL: 'https://via.placeholder.com/150x150?text=DU',
    authProvider: 'google.com',
    emailVerified: true,
    profileVisibility: 'public',
    showEmail: false,
    showLastActive: true,
    profanityFilterEnabled: true,
    createdAt: new Date('2023-01-01'),
    lastUpdated: new Date()
  };

  const user = mockUser !== null ? mockUser : defaultUser;
  const profile = mockProfile !== null ? mockProfile : defaultProfile;

  // Mock Firestore operations
  const mockFirestore = {
    collection: () => ({
      doc: () => ({
        get: async () => ({
          exists: () => true,
          data: () => profile
        }),
        set: async () => {},
        update: async () => {}
      }),
      where: () => ({
        get: async () => ({
          empty: profile.username ? false : true,
          docs: profile.username ? [{ data: () => ({ uid: user.uid, username: profile.username }) }] : []
        })
      }),
      add: async () => ({ id: 'mock_doc_id' })
    }),
    doc: () => ({
      get: async () => ({
        exists: () => true,
        data: () => profile
      }),
      set: async () => {},
      update: async () => {},
      onSnapshot: () => () => {} // Unsubscribe function
    })
  };

  const value = React.useMemo(() => ({
    auth: { currentUser: user },
    firestore: mockFirestore,
    rtdb: {},
    storage: {},
    user: user,
    loading: loading,
    
    // Auth providers and methods
    GoogleAuthProvider: function MockProvider() {},
    GithubAuthProvider: function MockProvider() {},
    EmailAuthProvider: function MockProvider() {},
    
    // Auth methods - enhanced for profile testing
    signInWithPopup: async (provider) => {
      console.log('Mock signInWithPopup called with provider:', provider);
      return { user: user };
    },
    signOut: async () => {
      console.log('Mock signOut called');
    },
    createUserWithEmailAndPassword: async (email, password) => {
      console.log('Mock createUserWithEmailAndPassword called:', email);
      return { user: { ...user, email, emailVerified: false } };
    },
    signInWithEmailAndPassword: async (email, password) => {
      console.log('Mock signInWithEmailAndPassword called:', email);
      return { user: { ...user, email } };
    },
    sendEmailVerification: async () => {
      console.log('Mock sendEmailVerification called');
    },
    sendPasswordResetEmail: async (email) => {
      console.log('Mock sendPasswordResetEmail called:', email);
    },
    updatePassword: async (newPassword) => {
      console.log('Mock updatePassword called');
    },
    
    // Firestore methods for profile management
    doc: mockFirestore.doc,
    collection: mockFirestore.collection,
    getDoc: async (docRef) => ({
      exists: () => true,
      data: () => profile
    }),
    setDoc: async (docRef, data) => {
      console.log('Mock setDoc called with data:', data);
    },
    updateDoc: async (docRef, data) => {
      console.log('Mock updateDoc called with data:', data);
    },
    query: () => ({}),
    where: () => ({}),
    getDocs: async () => ({
      empty: profile.username ? false : true,
      docs: profile.username ? [{ data: () => ({ uid: user.uid, username: profile.username }) }] : []
    })
  }), [user, profile, loading]);

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

// Export alias for backward compatibility
export const MockFirebaseProvider = FirebaseProviderMock;

// (No custom useFirebase export here; components use the real hook.)
