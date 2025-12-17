import { useCachedDocument } from "./useCachedDocument";
import { useFirebase } from "../FirebaseContext";

/**
 * Hook to fetch cached profile data for a specific user ID
 * Used for displaying enhanced profile information in messages
 * Uses caching with real-time updates
 *
 * @param {string} userId - The user ID to fetch profile data for
 * @returns {Object} { profileData, loading, error, refresh, invalidate }
 */
export function useCachedUserProfileData(userId) {
  const { firestore } = useFirebase();

  const {
    data: profileData,
    loading,
    error,
    refresh,
    invalidate,
  } = useCachedDocument(firestore, "userProfiles", userId, {
    ttl: 5 * 60 * 1000, // 5 minutes
    realtime: true, // Real-time updates for profile changes
    disabled: !userId,
  });

  return {
    profileData,
    loading,
    error,
    refresh,
    invalidate,
  };
}

export default useCachedUserProfileData;
