import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../services/FirebaseContext';

/**
 * Hook to fetch profile data for a specific user ID
 * Used for displaying enhanced profile information in messages
 * Now uses real-time updates via onSnapshot
 */
export function useUserProfileData(userId) {
  const { firestore } = useFirebase();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !firestore) {
      setProfileData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const profileRef = doc(firestore, 'userProfiles', userId);
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(
      profileRef,
      (profileSnap) => {
        setLoading(false);
        if (profileSnap.exists()) {
          setProfileData(profileSnap.data());
        } else {
          setProfileData(null);
        }
      },
      (err) => {
        console.error('Error loading user profile:', err);
        setError(err);
        setProfileData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, firestore]);

  return { profileData, loading, error };
}

export default useUserProfileData;