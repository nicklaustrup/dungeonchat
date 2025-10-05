/**
 * Firebase Caching System - Central Export
 * 
 * This file provides a convenient single import for all caching functionality
 * 
 * Usage Examples:
 * 
 * // Import individual hooks
 * import { useCachedUserProfile, useJoinedCampaigns } from './services/cache';
 * 
 * // Import cache utilities
 * import { firestoreCache, invalidateCampaign } from './services/cache';
 * 
 * // Use in components
 * function MyComponent() {
 *   const { profile, loading } = useCachedUserProfile();
 *   const { campaigns } = useJoinedCampaigns();
 *   // ... component logic
 * }
 * 
 * // Invalidate after mutations
 * async function updateCampaignDetails(campaignId, updates) {
 *   await updateDoc(doc(firestore, 'campaigns', campaignId), updates);
 *   invalidateCampaign(campaignId); // Clear cache
 * }
 */

// Core cache service and hooks
import firestoreCacheImport from './FirestoreCache';
import { useCachedDocument, useCachedQuery } from './useCachedDocument';
import { useCachedUserProfile } from './useCachedUserProfile';
import {
  useJoinedCampaigns,
  useCreatedCampaigns,
  useAllUserCampaigns,
  useCachedCampaign,
  invalidateUserCampaigns,
  invalidateCampaign,
  invalidateAllCampaigns
} from './useCampaignsCache';
import {
  useUserCharacters,
  useCampaignCharacters,
  useCachedCharacter,
  useCachedCharacters,
  useActiveCharacter,
  invalidateUserCharacters,
  invalidateCampaignCharacters,
  invalidateCharacter,
  invalidateAllCharacters
} from './useCharactersCache';

// Re-export core services
export { default as firestoreCache } from './FirestoreCache';
export { useCachedDocument, useCachedQuery } from './useCachedDocument';

// User profile caching
export { useCachedUserProfile } from './useCachedUserProfile';

// Campaign caching
export {
  useJoinedCampaigns,
  useCreatedCampaigns,
  useAllUserCampaigns,
  useCachedCampaign,
  invalidateUserCampaigns,
  invalidateCampaign,
  invalidateAllCampaigns,
  default as campaignsCache
} from './useCampaignsCache';

// Character caching
export {
  useUserCharacters,
  useCampaignCharacters,
  useCachedCharacter,
  useCachedCharacters,
  useActiveCharacter,
  invalidateUserCharacters,
  invalidateCampaignCharacters,
  invalidateCharacter,
  invalidateAllCharacters,
  default as charactersCache
} from './useCharactersCache';

/**
 * Get current cache statistics
 * Useful for monitoring cache performance
 */
export function getCacheStats() {
  const cache = require('./FirestoreCache').default;
  return cache.getStats();
}

/**
 * Clear entire cache
 * Use sparingly - only for logout or major app state changes
 */
export function clearAllCache() {
  const cache = require('./FirestoreCache').default;
  cache.clear();
}

/**
 * Log cache statistics to console
 * Useful for debugging cache performance
 */
export function logCacheStats() {
  const cache = require('./FirestoreCache').default;
  const stats = cache.getStats();
  console.group('📊 Firebase Cache Statistics');
  console.log(`Cache Hits: ${stats.hits}`);
  console.log(`Cache Misses: ${stats.misses}`);
  console.log(`Hit Rate: ${stats.hitRate}`);
  console.log(`Invalidations: ${stats.invalidations}`);
  console.log(`Evictions: ${stats.evictions}`);
  console.log(`Cache Size: ${stats.size} entries`);
  console.groupEnd();
}

/**
 * Cache invalidation strategy guide
 * 
 * When to invalidate cache:
 * 
 * 1. After CREATE operations:
 *    - invalidateUserCharacters(userId) after creating character
 *    - invalidateUserCampaigns(userId) after creating/joining campaign
 * 
 * 2. After UPDATE operations:
 *    - invalidateCharacter(characterId) after updating character
 *    - invalidateCampaign(campaignId) after updating campaign
 *    - Use field-level invalidation for specific changes
 * 
 * 3. After DELETE operations:
 *    - invalidateUserCharacters(userId) after deleting character
 *    - invalidateUserCampaigns(userId) after leaving campaign
 * 
 * 4. On user logout:
 *    - clearAllCache() to remove all cached data
 * 
 * 5. Real-time updates:
 *    - Most hooks have realtime: true by default
 *    - Cache auto-updates via Firestore listeners
 *    - No manual invalidation needed for realtime data
 */

// Default export with all cache utilities
const cacheExports = {
  firestoreCache: firestoreCacheImport,
  useCachedDocument,
  useCachedQuery,
  useCachedUserProfile,
  useJoinedCampaigns,
  useCreatedCampaigns,
  useAllUserCampaigns,
  useCachedCampaign,
  useUserCharacters,
  useCampaignCharacters,
  useCachedCharacter,
  useCachedCharacters,
  useActiveCharacter,
  invalidateUserCampaigns,
  invalidateCampaign,
  invalidateAllCampaigns,
  invalidateUserCharacters,
  invalidateCampaignCharacters,
  invalidateCharacter,
  invalidateAllCharacters,
  getCacheStats,
  clearAllCache,
  logCacheStats
};

export default cacheExports;
