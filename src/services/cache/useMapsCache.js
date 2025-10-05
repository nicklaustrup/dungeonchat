/**
 * Maps Caching Hooks
 *
 * Provides cached access to campaign maps with real-time updates.
 * Reduces Firebase reads for frequently accessed map data.
 *
 * Usage:
 * ```js
 * import { useCampaignMaps, useCachedMap, invalidateCampaignMaps } from './services/cache';
 *
 * // Get all maps for a campaign
 * const { maps, loading } = useCampaignMaps(campaignId);
 *
 * // Get single map
 * const { map, loading } = useCachedMap(campaignId, mapId);
 *
 * // After map mutations, invalidate cache
 * await mapService.createMap(firestore, campaignId, mapData);
 * invalidateCampaignMaps(campaignId);
 * ```
 */

import { useCachedQuery, useCachedDocument } from './useCachedDocument';
import { useFirebase } from '../FirebaseContext';
import firestoreCache from './FirestoreCache';

/**
 * Get all maps for a campaign (cached with real-time updates)
 *
 * @param {string} campaignId - Campaign ID
 * @param {Object} options - Cache options
 * @returns {Object} { maps, loading, error, refresh, invalidate }
 */
export function useCampaignMaps(campaignId, options = {}) {
  const { firestore } = useFirebase();

  const queryFn = async () => {
    if (!campaignId) return [];

    const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
    const mapsRef = collection(firestore, 'campaigns', campaignId, 'maps');
    const q = query(mapsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const {
    data: maps = [],
    loading,
    error,
    refresh,
    invalidate
  } = useCachedQuery(
    firestore,
    queryFn,
    `maps/campaign/${campaignId}`,
    {
      ttl: 10 * 60 * 1000, // 10 minutes (maps don't change frequently)
      realtime: true,
      disabled: !campaignId,
      ...options
    }
  );

  return { maps, loading, error, refresh, invalidate };
}

/**
 * Get single map by ID (cached with real-time updates)
 *
 * @param {string} campaignId - Campaign ID
 * @param {string} mapId - Map ID
 * @param {Object} options - Cache options
 * @returns {Object} { map, loading, error, refresh, invalidate }
 */
export function useCachedMap(campaignId, mapId, options = {}) {
  const { firestore } = useFirebase();

  const {
    data: map,
    loading,
    error,
    refresh,
    invalidate
  } = useCachedDocument(
    firestore,
    'maps',
    mapId,
    {
      ttl: 10 * 60 * 1000, // 10 minutes
      realtime: true,
      disabled: !campaignId || !mapId,
      collectionPath: `campaigns/${campaignId}/maps`,
      ...options
    }
  );

  return { map, loading, error, refresh, invalidate };
}

/**
 * Get active map for a campaign (cached)
 * Finds the map with isActive: true
 *
 * @param {string} campaignId - Campaign ID
 * @param {Object} options - Cache options
 * @returns {Object} { map, loading, error, refresh, invalidate }
 */
export function useActiveMap(campaignId, options = {}) {
  const { firestore } = useFirebase();

  const queryFn = async () => {
    if (!campaignId) return null;

    const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
    const mapsRef = collection(firestore, 'campaigns', campaignId, 'maps');
    const q = query(mapsRef, where('isActive', '==', true), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  };

  const {
    data: map,
    loading,
    error,
    refresh,
    invalidate
  } = useCachedQuery(
    firestore,
    queryFn,
    `maps/active/${campaignId}`,
    {
      ttl: 5 * 60 * 1000, // 5 minutes (active map changes more frequently)
      realtime: true,
      disabled: !campaignId,
      ...options
    }
  );

  return { map, loading, error, refresh, invalidate };
}

/**
 * Cache Invalidation Functions
 */

/**
 * Invalidate all maps for a campaign
 * Call after creating, updating, or deleting a map
 *
 * @param {string} campaignId - Campaign ID
 */
export function invalidateCampaignMaps(campaignId) {
  if (!campaignId) return;

  console.warn(
    '%c[CACHE] 🗑️ INVALIDATE',
    'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
    `maps/campaign/${campaignId}`
  );

  firestoreCache.invalidatePattern(`maps/campaign/${campaignId}`);
  firestoreCache.invalidatePattern(`maps/active/${campaignId}`);
}

/**
 * Invalidate single map cache
 * Call after updating a specific map
 *
 * @param {string} mapId - Map ID
 * @param {string} campaignId - Campaign ID (optional, but recommended for active map cache)
 */
export function invalidateMap(mapId, campaignId = null) {
  if (!mapId) return;

  console.warn(
    '%c[CACHE] 🗑️ INVALIDATE',
    'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
    `maps/${mapId}`
  );

  firestoreCache.invalidate(`maps/${mapId}`);

  // Also invalidate campaign maps list if campaignId provided
  if (campaignId) {
    firestoreCache.invalidatePattern(`maps/campaign/${campaignId}`);
    firestoreCache.invalidatePattern(`maps/active/${campaignId}`);
  }
}

/**
 * Invalidate all maps (use sparingly)
 * Call on logout or major state changes
 */
export function invalidateAllMaps() {
  console.warn(
    '%c[CACHE] 🗑️ INVALIDATE ALL',
    'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
    'maps/*'
  );

  firestoreCache.invalidatePattern('maps/');
}

/**
 * Default export with all map cache utilities
 */
const mapsCache = {
  useCampaignMaps,
  useCachedMap,
  useActiveMap,
  invalidateCampaignMaps,
  invalidateMap,
  invalidateAllMaps
};

export default mapsCache;
