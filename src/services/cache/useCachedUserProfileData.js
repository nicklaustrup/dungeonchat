import { useCachedDocument } from './useCachedDocument';

/**
 * Hook to fetch cached profile data for a specific user ID
 * Used for displaying enhanced profile information in messages
 * Uses caching with real-time updates
 * 
 * @param {string} userId - The user ID to fetch profile data for
 * @returns {Object} { profileData, loading, error, refresh, invalidate }
 */
export function useCachedUserProfileData(userId) {
  const {
    data: profileData,
    loading,
    error,
    refresh,
    invalidate
  } = useCachedDocument(
    userId ? 'userProfiles' : null,
    userId,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      enableRealtime: true // Real-time updates for profile changes
    }
  );

  return {
    profileData,
    loading,
    error,
    refresh,
    invalidate
  };
}

export default useCachedUserProfileData;
