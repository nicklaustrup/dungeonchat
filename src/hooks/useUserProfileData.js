import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../services/FirebaseContext';

/**
 * Hook to fetch profile data for a specific user ID
 * Used for displaying enhanced profile information in messages
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

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const profileRef = doc(firestore, 'userProfiles', userId);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfileData(profileSnap.data());
        } else {
          setProfileData(null);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError(err);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, firestore]);

  return { profileData, loading, error };
}

export default useUserProfileData;