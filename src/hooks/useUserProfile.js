import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '../services/FirebaseContext';

/**
 * Hook for managing user profile data in Firestore
 * Handles reading and updating user preferences including profanity filter settings
 */
export function useUserProfile() {
  const { firestore, user } = useFirebase();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount or user change
  useEffect(() => {
    if (!user?.uid || !firestore) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const profileRef = doc(firestore, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        } else {
          // Create default profile for new users
          const newProfile = { 
            uid: user.uid,
            profanityFilterEnabled: true, // Default to enabled for new users
            createdAt: new Date(),
            lastUpdated: new Date()
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError(err);
        // Fallback to default profile if there's an error
        setProfile({
          uid: user.uid,
          profanityFilterEnabled: true,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid, firestore]); // Removed defaultProfile dependency

  // Update profile data
  const updateProfile = async (updates) => {
    if (!user?.uid || !firestore) {
      throw new Error('User not authenticated');
    }

    try {
      const profileRef = doc(firestore, 'userProfiles', user.uid);
      const updatedData = {
        ...updates,
        lastUpdated: new Date()
      };
      
      await updateDoc(profileRef, updatedData);
      
      // Update local state
      setProfile(prev => ({ ...prev, ...updatedData }));
      
      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err);
      throw err;
    }
  };

  // Convenience method to toggle profanity filter
  const toggleProfanityFilter = async () => {
    if (!profile) return false;
    
    const newValue = !profile.profanityFilterEnabled;
    await updateProfile({ profanityFilterEnabled: newValue });
    return newValue;
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    toggleProfanityFilter,
    profanityFilterEnabled: profile?.profanityFilterEnabled ?? true
  };
}

export default useUserProfile;