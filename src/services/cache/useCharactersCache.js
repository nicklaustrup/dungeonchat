import { useCallback } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirebase } from '../FirebaseContext';
import { useCachedQuery, useCachedDocument } from './useCachedDocument';
import firestoreCache from './FirestoreCache';

/**
 * Cached Characters Hook
 * 
 * Provides cached access to user's characters with real-time updates
 * Automatically handles cache invalidation on character changes
 * 
 * Features:
 * - Automatic caching of character lists
 * - Real-time updates via Firestore listeners
 * - Campaign-specific character queries
 * - Automatic cache invalidation on mutations
 */

/**
 * Get all characters owned by the user
 */
export function useUserCharacters() {
  const { firestore, user } = useFirebase();

  const queryFn = useCallback(() => {
    if (!user?.uid) return null;

    const charactersRef = collection(firestore, 'characters');
    return query(
      charactersRef,
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const cacheKey = `characters/user/${user?.uid}`;

  const { data, loading, error, refresh, invalidate } = useCachedQuery(
    firestore,
    queryFn,
    cacheKey,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      realtime: true,
      disabled: !user?.uid
    }
  );

  return {
    characters: data,
    // If user hasn't loaded yet, we're still loading
    loading: !user?.uid || loading,
    error,
    refresh,
    invalidate
  };
}

/**
 * Get characters for a specific campaign
 */
export function useCampaignCharacters(campaignId) {
  const { firestore } = useFirebase();

  const queryFn = useCallback(() => {
    if (!campaignId) return null;
    
    const charactersRef = collection(firestore, 'characters');
    return query(
      charactersRef,
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, campaignId]);

  const cacheKey = `characters/campaign/${campaignId}`;

  const { data, loading, error, refresh, invalidate } = useCachedQuery(
    firestore,
    queryFn,
    cacheKey,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      realtime: true,
      disabled: !campaignId
    }
  );

  return {
    characters: data,
    loading,
    error,
    refresh,
    invalidate
  };
}

/**
 * Get a single character by ID
 */
export function useCachedCharacter(characterId) {
  const { firestore } = useFirebase();

  const { data, loading, error, refresh, invalidate } = useCachedDocument(
    firestore,
    'characters',
    characterId,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      realtime: true,
      disabled: !characterId
    }
  );

  return {
    character: data,
    loading,
    error,
    refresh,
    invalidate
  };
}

/**
 * Get characters by multiple IDs
 * Useful for fetching party members or specific character groups
 */
export function useCachedCharacters(characterIds) {
  const { firestore } = useFirebase();

  const queryFn = useCallback(() => {
    if (!characterIds || characterIds.length === 0) return null;
    
    const charactersRef = collection(firestore, 'characters');
    // Firestore 'in' queries are limited to 10 items
    const limitedIds = characterIds.slice(0, 10);
    
    return query(
      charactersRef,
      where('__name__', 'in', limitedIds)
    );
  }, [firestore, characterIds]);

  const cacheKey = `characters/batch/${characterIds?.sort().join(',')}`;

  const { data, loading, error, refresh, invalidate } = useCachedQuery(
    firestore,
    queryFn,
    cacheKey,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      realtime: true,
      disabled: !characterIds || characterIds.length === 0
    }
  );

  return {
    characters: data,
    loading,
    error,
    refresh,
    invalidate
  };
}

/**
 * Get active character for a campaign
 * Returns the character marked as active for the current campaign
 */
export function useActiveCharacter(campaignId) {
  const { firestore, user } = useFirebase();

  const queryFn = useCallback(() => {
    if (!user?.uid || !campaignId) return null;
    
    const charactersRef = collection(firestore, 'characters');
    return query(
      charactersRef,
      where('uid', '==', user.uid),
      where('campaignId', '==', campaignId),
      where('isActive', '==', true)
    );
  }, [firestore, user, campaignId]);

  const cacheKey = `characters/active/${user?.uid}/${campaignId}`;

  const { data, loading, error, refresh, invalidate } = useCachedQuery(
    firestore,
    queryFn,
    cacheKey,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      realtime: true,
      disabled: !user?.uid || !campaignId
    }
  );

  return {
    character: data?.[0] || null, // Return first active character
    loading,
    error,
    refresh,
    invalidate
  };
}

/**
 * Invalidate all character caches for a user
 * Call this after creating or deleting a character
 */
export function invalidateUserCharacters(userId) {
  firestoreCache.invalidate(`characters/user/${userId}`);
  firestoreCache.invalidate(`characters/active/${userId}/*`);
}

/**
 * Invalidate character caches for a campaign
 * Call this after character joins/leaves campaign
 */
export function invalidateCampaignCharacters(campaignId) {
  firestoreCache.invalidate(`characters/campaign/${campaignId}`);
  firestoreCache.invalidate(`characters/active/*/${campaignId}`);
}

/**
 * Invalidate a specific character cache
 * Call this after updating character details
 */
export function invalidateCharacter(characterId) {
  firestoreCache.invalidateDocument('characters', characterId);
}

/**
 * Invalidate all characters
 * Use sparingly - only for major character-related changes
 */
export function invalidateAllCharacters() {
  firestoreCache.invalidateCollection('characters');
}

// Default export with all character cache utilities
const charactersCache = {
  useUserCharacters,
  useCampaignCharacters,
  useCachedCharacter,
  useCachedCharacters,
  useActiveCharacter,
  invalidateUserCharacters,
  invalidateCampaignCharacters,
  invalidateCharacter,
  invalidateAllCharacters
};

export default charactersCache;
