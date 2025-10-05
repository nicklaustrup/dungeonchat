import { useCallback } from 'react';
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../FirebaseContext';
import { useCachedDocument } from './useCachedDocument';
import firestoreCache from './FirestoreCache';
import { uploadProfilePicture, deleteProfilePicture } from '../../utils/profilePictureUtils';
import { httpsCallable } from 'firebase/functions';

/**
 * Cached User Profile Hook
 * 
 * Enhanced version of useUserProfile with automatic caching
 * Provides the same API but with reduced Firebase reads
 * 
 * Features:
 * - Automatic caching with 5-minute TTL
 * - Real-time updates via Firestore listeners
 * - Field-level cache invalidation
 * - Optimistic updates with rollback on error
 */
export function useCachedUserProfile() {
  const { firestore, user, functions, storage } = useFirebase();

  // Use cached document hook with real-time updates
  const { 
    data: profile, 
    loading, 
    error,
    refresh,
    invalidate 
  } = useCachedDocument(
    firestore,
    'userProfiles',
    user?.uid,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      realtime: true, // Enable real-time updates
      disabled: !user?.uid
    }
  );

  /**
   * Check if username is available
   */
  const checkUsernameAvailability = useCallback(async (username) => {
    if (!functions || !username) {
      return { available: false, error: 'Invalid input' };
    }

    try {
      const checkUsername = httpsCallable(functions, 'checkUsernameAvailability');
      const result = await checkUsername({ username });
      return result.data;
    } catch (err) {
      console.error('Error checking username:', err);
      
      // Fallback to client-side check
      try {
        const usernamesRef = doc(firestore, 'usernames', username.toLowerCase());
        const usernameSnap = await getDoc(usernamesRef);
        return { available: !usernameSnap.exists() };
      } catch (fallbackErr) {
        console.error('Fallback username check failed:', fallbackErr);
        return { available: false, error: 'Unable to check username availability' };
      }
    }
  }, [functions, firestore]);

  /**
   * Update profile with optimistic update and cache invalidation
   */
  const updateProfile = useCallback(async (updates) => {
    if (!user?.uid || !firestore) {
      throw new Error('User not authenticated');
    }

    const profileRef = doc(firestore, 'userProfiles', user.uid);
    
    // Optimistic update - update cache immediately
    const cacheKey = firestoreCache.generateKey('userProfiles', user.uid);
    const currentCache = firestoreCache.get(cacheKey);
    
    if (currentCache) {
      firestoreCache.set(cacheKey, {
        ...currentCache,
        ...updates,
        lastUpdated: new Date()
      });
    }

    try {
      await updateDoc(profileRef, {
        ...updates,
        lastUpdated: new Date()
      });

      // Invalidate specific fields if needed
      if (updates.username) {
        firestoreCache.invalidateField('userProfiles', user.uid, 'username');
      }
      if (updates.profilePictureURL) {
        firestoreCache.invalidateField('userProfiles', user.uid, 'profilePictureURL');
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Rollback optimistic update
      if (currentCache) {
        firestoreCache.set(cacheKey, currentCache);
      }
      
      throw err;
    }
  }, [user, firestore]);

  /**
   * Update username with cache invalidation
   */
  const updateUsername = useCallback(async (newUsername) => {
    if (!user?.uid || !firestore) {
      throw new Error('User not authenticated');
    }

    if (!newUsername || newUsername.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    // Check availability first
    const availability = await checkUsernameAvailability(newUsername);
    if (!availability.available) {
      throw new Error('Username not available');
    }

    const oldUsername = profile?.username;
    const profileRef = doc(firestore, 'userProfiles', user.uid);

    try {
      // Update profile
      await updateDoc(profileRef, {
        username: newUsername,
        lastUpdated: new Date()
      });

      // Update usernames index
      const newUsernameRef = doc(firestore, 'usernames', newUsername.toLowerCase());
      await setDoc(newUsernameRef, {
        uid: user.uid,
        username: newUsername,
        createdAt: new Date()
      });

      // Remove old username from index if it exists
      if (oldUsername) {
        const oldUsernameRef = doc(firestore, 'usernames', oldUsername.toLowerCase());
        await deleteDoc(oldUsernameRef);
      }

      // Invalidate username cache
      firestoreCache.invalidateField('userProfiles', user.uid, 'username');

      return { success: true };
    } catch (err) {
      console.error('Error updating username:', err);
      throw err;
    }
  }, [user, firestore, profile, checkUsernameAvailability]);

  /**
   * Upload profile picture with cache invalidation
   */
  const uploadPicture = useCallback(async (file) => {
    if (!user?.uid || !storage) {
      throw new Error('User not authenticated or storage not available');
    }

    try {
      const url = await uploadProfilePicture(user.uid, file, storage, firestore);
      
      // Invalidate profile picture cache
      firestoreCache.invalidateField('userProfiles', user.uid, 'profilePictureURL');
      
      return url;
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      throw err;
    }
  }, [user, storage, firestore]);

  /**
   * Delete profile picture with cache invalidation
   */
  const deletePicture = useCallback(async () => {
    if (!user?.uid || !storage) {
      throw new Error('User not authenticated or storage not available');
    }

    try {
      await deleteProfilePicture(user.uid, storage, firestore);
      
      // Invalidate profile picture cache
      firestoreCache.invalidateField('userProfiles', user.uid, 'profilePictureURL');
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting profile picture:', err);
      throw err;
    }
  }, [user, storage, firestore]);

  /**
   * Create initial profile for new users
   */
  const createProfile = useCallback(async (profileData) => {
    if (!user?.uid || !firestore) {
      throw new Error('User not authenticated');
    }

    const profileRef = doc(firestore, 'userProfiles', user.uid);

    const authProvider = user.providerData?.[0]?.providerId || 'unknown';

    const newProfile = {
      uid: user.uid,
      username: profileData.username || '',
      displayName: user.displayName || '',
      email: user.email || '',
      bio: profileData.bio || '',
      statusMessage: '',
      profilePictureURL: user.photoURL || '',
      authProvider: authProvider,
      emailVerified: user.emailVerified || false,
      profileVisibility: 'public',
      showEmail: false,
      showLastActive: true,
      profanityFilterEnabled: true,
      createdAt: new Date(),
      lastUpdated: new Date(),
      ...profileData
    };

    try {
      await setDoc(profileRef, newProfile);
      
      // Cache the new profile
      const cacheKey = firestoreCache.generateKey('userProfiles', user.uid);
      firestoreCache.set(cacheKey, newProfile);

      return { success: true };
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err;
    }
  }, [user, firestore]);

  // Computed properties for onboarding status (compatibility with original useUserProfile)
  const isProfileComplete = !!(profile?.username && profile?.username.trim());
  const needsOnboarding = !profile?.username || !profile?.username.trim();

  /**
   * Update privacy settings
   */
  const updatePrivacySettings = useCallback(async (settings) => {
    const allowedSettings = ['profileVisibility', 'showEmail', 'showLastActive'];
    const filteredSettings = Object.keys(settings)
      .filter(key => allowedSettings.includes(key))
      .reduce((obj, key) => {
        obj[key] = settings[key];
        return obj;
      }, {});
    
    await updateProfile(filteredSettings);
  }, [updateProfile]);

  /**
   * Toggle profanity filter
   */
  const toggleProfanityFilter = useCallback(async () => {
    if (!profile) return false;
    
    const newValue = !profile.profanityFilterEnabled;
    await updateProfile({ profanityFilterEnabled: newValue });
    return newValue;
  }, [profile, updateProfile]);

  /**
   * Get display info for current user
   */
  const getDisplayInfo = useCallback(() => {
    if (!profile) return null;
    
    return {
      displayName: profile.username || profile.displayName || 'Anonymous',
      username: profile.username,
      originalDisplayName: profile.displayName,
      profilePicture: profile.profilePictureURL,
      bio: profile.bio,
      statusMessage: profile.statusMessage,
      isComplete: !!(profile.username && profile.username.trim())
    };
  }, [profile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateUsername,
    uploadPicture,
    deletePicture,
    checkUsernameAvailability,
    createProfile,
    refresh,
    invalidate,
    updatePrivacySettings,
    toggleProfanityFilter,
    getDisplayInfo,
    // Convenience accessors
    profanityFilterEnabled: profile?.profanityFilterEnabled ?? true,
    // Onboarding status
    isProfileComplete,
    needsOnboarding
  };
}

export default useCachedUserProfile;
