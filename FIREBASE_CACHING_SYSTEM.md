# Firebase Caching System Documentation

## Overview

The Firebase Caching System is a comprehensive caching layer built on top of Firestore that significantly reduces Firebase read operations while maintaining real-time data synchronization. It provides a simple React hooks API that can be used as drop-in replacements for existing Firestore queries.

## Features

- ✅ **Automatic Caching**: Transparently caches Firestore reads with configurable TTL
- ✅ **Real-time Updates**: Supports Firestore listeners for live data synchronization
- ✅ **Smart Invalidation**: Pattern-based cache invalidation with wildcard support
- ✅ **Optimistic Updates**: Update cache immediately, rollback on error
- ✅ **Performance Monitoring**: Built-in statistics tracking (hits, misses, hit rate)
- ✅ **Memory Management**: Automatic cleanup of expired cache entries
- ✅ **Type Safety**: Full TypeScript-ready with JSDoc comments

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Specialized Hooks                         │
│  useCachedUserProfile, useJoinedCampaigns, etc.             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Base Hooks                              │
│         useCachedDocument, useCachedQuery                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FirestoreCache Service                     │
│         Singleton cache with TTL and invalidation            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Firestore                        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```javascript
import { useCachedUserProfile, useJoinedCampaigns } from './services/cache';

function MyComponent() {
  // Drop-in replacement for useUserProfile
  const { profile, loading, error } = useCachedUserProfile();
  
  // Get user's campaigns with automatic caching
  const { campaigns } = useJoinedCampaigns();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{profile.username}</h1>
      <p>Campaigns: {campaigns.length}</p>
    </div>
  );
}
```

### Cache Invalidation After Mutations

```javascript
import { invalidateCampaign, invalidateUserCampaigns } from './services/cache';

async function updateCampaign(campaignId, updates) {
  // Update Firestore
  await updateDoc(doc(firestore, 'campaigns', campaignId), updates);
  
  // Invalidate cache
  invalidateCampaign(campaignId);
}

async function joinCampaign(campaignId, userId) {
  // Add user to campaign
  await updateDoc(doc(firestore, 'campaigns', campaignId), {
    members: arrayUnion(userId)
  });
  
  // Invalidate user's campaign list
  invalidateUserCampaigns(userId);
}
```

## Available Hooks

### User Profile

#### `useCachedUserProfile()`

Cached version of user profile with real-time updates.

```javascript
const { 
  profile,           // User profile data
  loading,           // Loading state
  error,             // Error state
  updateProfile,     // Update profile function
  updateUsername,    // Update username function
  uploadPicture,     // Upload profile picture
  deletePicture,     // Delete profile picture
  refresh,           // Force refresh from Firestore
  invalidate         // Clear cache
} = useCachedUserProfile();
```

**Features**:
- 5-minute TTL
- Real-time updates enabled
- Optimistic updates with rollback
- Field-level cache invalidation

### Campaigns

#### `useJoinedCampaigns()`

Get campaigns the user has joined.

```javascript
const { 
  campaigns,  // Array of campaign objects
  loading,    // Loading state
  error,      // Error state
  refresh,    // Force refresh
  invalidate  // Clear cache
} = useJoinedCampaigns();
```

**Features**:
- 3-minute TTL
- Real-time updates enabled
- Ordered by lastActivityAt (descending)

#### `useCreatedCampaigns()`

Get campaigns created by the user.

```javascript
const { campaigns, loading, error } = useCreatedCampaigns();
```

**Features**:
- 3-minute TTL
- Real-time updates enabled
- Ordered by createdAt (descending)

#### `useAllUserCampaigns()`

Get all campaigns (both joined and created).

```javascript
const { campaigns, loading, error } = useAllUserCampaigns();
```

**Features**:
- Combines and deduplicates joined + created campaigns
- Sorted by most recent activity

#### `useCachedCampaign(campaignId)`

Get a single campaign by ID.

```javascript
const { campaign, loading, error } = useCachedCampaign(campaignId);
```

**Features**:
- 5-minute TTL
- Real-time updates enabled

### Characters

#### `useUserCharacters()`

Get all characters owned by the user.

```javascript
const { 
  characters, // Array of character objects
  loading,    // Loading state
  error,      // Error state
  refresh,    // Force refresh
  invalidate  // Clear cache
} = useUserCharacters();
```

**Features**:
- 5-minute TTL
- Real-time updates enabled
- Ordered by createdAt (descending)

#### `useCampaignCharacters(campaignId)`

Get all characters in a campaign.

```javascript
const { characters, loading, error } = useCampaignCharacters(campaignId);
```

**Features**:
- 5-minute TTL
- Real-time updates enabled
- Ordered by createdAt (ascending)

#### `useCachedCharacter(characterId)`

Get a single character by ID.

```javascript
const { character, loading, error } = useCachedCharacter(characterId);
```

#### `useCachedCharacters(characterIds)`

Get multiple characters by ID array.

```javascript
const { characters, loading, error } = useCachedCharacters([id1, id2, id3]);
```

**Note**: Limited to 10 characters due to Firestore 'in' query constraints.

#### `useActiveCharacter(campaignId)`

Get the active character for a campaign.

```javascript
const { character, loading, error } = useActiveCharacter(campaignId);
```

## Cache Invalidation

### Strategy Guide

Cache invalidation is critical for keeping cached data synchronized with Firestore. Follow these guidelines:

#### 1. After CREATE Operations

```javascript
// After creating a character
invalidateUserCharacters(userId);

// After creating/joining a campaign
invalidateUserCampaigns(userId);
```

#### 2. After UPDATE Operations

```javascript
// After updating a character
invalidateCharacter(characterId);

// After updating a campaign
invalidateCampaign(campaignId);

// After updating user profile
// (useCachedUserProfile handles this automatically)
```

#### 3. After DELETE Operations

```javascript
// After deleting a character
invalidateUserCharacters(userId);

// After leaving a campaign
invalidateUserCampaigns(userId);
```

#### 4. On User Logout

```javascript
import { clearAllCache } from './services/cache';

function logout() {
  // ... logout logic
  clearAllCache(); // Remove all cached data
}
```

### Invalidation Functions

```javascript
// User invalidation
invalidateUserProfile(userId);

// Campaign invalidation
invalidateUserCampaigns(userId);  // User's campaign list
invalidateCampaign(campaignId);   // Single campaign
invalidateAllCampaigns();         // All campaigns (use sparingly)

// Character invalidation
invalidateUserCharacters(userId);       // User's character list
invalidateCampaignCharacters(campaignId); // Campaign character list
invalidateCharacter(characterId);       // Single character
invalidateAllCharacters();              // All characters (use sparingly)

// Global invalidation
clearAllCache(); // Clear entire cache (logout only)
```

### Pattern-Based Invalidation

Use wildcards for flexible invalidation:

```javascript
import { firestoreCache } from './services/cache';

// Invalidate all campaigns for a user
firestoreCache.invalidate(`campaigns/joined/${userId}`);
firestoreCache.invalidate(`campaigns/created/${userId}`);

// Invalidate all active characters for a user
firestoreCache.invalidate(`characters/active/${userId}/*`);

// Invalidate all characters in a campaign
firestoreCache.invalidate(`characters/campaign/${campaignId}`);
```

## Advanced Usage

### Custom Hooks with useCachedDocument

```javascript
import { useCachedDocument } from './services/cache';

function useCustomData(dataId) {
  const { firestore } = useFirebase();
  
  return useCachedDocument(
    firestore,
    'myCollection',
    dataId,
    {
      ttl: 2 * 60 * 1000,  // 2 minutes
      realtime: true,       // Enable real-time updates
      disabled: !dataId     // Disable if no ID
    }
  );
}
```

### Custom Queries with useCachedQuery

```javascript
import { useCachedQuery } from './services/cache';

function useFilteredData(userId, filter) {
  const { firestore } = useFirebase();
  
  const queryFn = useCallback(() => {
    const ref = collection(firestore, 'data');
    return query(
      ref,
      where('userId', '==', userId),
      where('type', '==', filter)
    );
  }, [firestore, userId, filter]);
  
  return useCachedQuery(
    firestore,
    queryFn,
    `data/${userId}/${filter}`, // Unique cache key
    { ttl: 60000, realtime: true }
  );
}
```

### Optimistic Updates

```javascript
import { firestoreCache } from './services/cache';

async function optimisticUpdate(docId, updates) {
  // Get current cache
  const cacheKey = firestoreCache.generateKey('collection', docId);
  const currentData = firestoreCache.get(cacheKey);
  
  // Update cache immediately
  firestoreCache.set(cacheKey, {
    ...currentData,
    ...updates
  });
  
  try {
    // Update Firestore
    await updateDoc(doc(firestore, 'collection', docId), updates);
  } catch (error) {
    // Rollback on error
    if (currentData) {
      firestoreCache.set(cacheKey, currentData);
    }
    throw error;
  }
}
```

## Performance Monitoring

### View Cache Statistics

```javascript
import { getCacheStats, logCacheStats } from './services/cache';

// Get stats programmatically
const stats = getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}`);

// Log formatted stats to console
logCacheStats();
// Output:
// 📊 Firebase Cache Statistics
// Cache Hits: 1234
// Cache Misses: 56
// Hit Rate: 95.65%
// Invalidations: 78
// Evictions: 12
// Cache Size: 145 entries
```

### Monitor in Development

```javascript
// Add to App.js for development monitoring
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const interval = setInterval(() => {
      logCacheStats();
    }, 30000); // Log every 30 seconds
    
    return () => clearInterval(interval);
  }
}, []);
```

## Configuration

### Default TTL Values

- **User Profiles**: 5 minutes
- **Campaigns**: 3 minutes (lists), 5 minutes (single)
- **Characters**: 5 minutes
- **Custom**: Configurable per hook

### Adjusting TTL

```javascript
// Shorter TTL for frequently changing data
const { data } = useCachedDocument(firestore, 'live-data', id, {
  ttl: 30000 // 30 seconds
});

// Longer TTL for static data
const { data } = useCachedDocument(firestore, 'static-data', id, {
  ttl: 30 * 60 * 1000 // 30 minutes
});
```

### Real-time Updates

```javascript
// Enable real-time updates (default for most hooks)
const { data } = useCachedDocument(firestore, 'collection', id, {
  realtime: true
});

// Disable real-time updates for static data
const { data } = useCachedDocument(firestore, 'collection', id, {
  realtime: false
});
```

## Migration Guide

### Replacing Existing Hooks

**Before**:
```javascript
import useUserProfile from './services/useUserProfile';

function MyComponent() {
  const { profile, loading, updateProfile } = useUserProfile();
  // ...
}
```

**After**:
```javascript
import { useCachedUserProfile } from './services/cache';

function MyComponent() {
  const { profile, loading, updateProfile } = useCachedUserProfile();
  // Same API, automatic caching!
}
```

### Adding Cache Invalidation to Services

**Before**:
```javascript
// campaignService.js
export async function updateCampaign(campaignId, updates) {
  const campaignRef = doc(firestore, 'campaigns', campaignId);
  await updateDoc(campaignRef, updates);
}
```

**After**:
```javascript
// campaignService.js
import { invalidateCampaign } from './cache';

export async function updateCampaign(campaignId, updates) {
  const campaignRef = doc(firestore, 'campaigns', campaignId);
  await updateDoc(campaignRef, updates);
  
  // Invalidate cache
  invalidateCampaign(campaignId);
}
```

## Best Practices

### ✅ DO

- Use specialized hooks when available (useCachedUserProfile vs useCachedDocument)
- Invalidate cache after mutations
- Use real-time updates for frequently changing data
- Monitor cache statistics in development
- Use pattern-based invalidation for bulk operations
- Call `clearAllCache()` on logout

### ❌ DON'T

- Don't invalidate cache unnecessarily (hurts performance)
- Don't use `invalidateAll*()` functions unless absolutely necessary
- Don't forget to disable hooks when inputs are null/undefined
- Don't mix cached and non-cached hooks for the same data
- Don't set TTL too low (defeats purpose of caching)
- Don't forget to clean up listeners (hooks do this automatically)

## Troubleshooting

### Cache Not Updating After Mutation

**Problem**: Data doesn't update after changing it in Firestore.

**Solution**: Call the appropriate invalidation function after the mutation:

```javascript
await updateDoc(doc(firestore, 'campaigns', id), updates);
invalidateCampaign(id); // Add this
```

### Stale Data Showing

**Problem**: Old data appears even though Firestore has new data.

**Solutions**:
1. Check if real-time updates are enabled (`realtime: true`)
2. Verify TTL hasn't expired yet
3. Call `refresh()` to force a cache refresh
4. Ensure cache invalidation is called after mutations

### Memory Issues

**Problem**: App using too much memory.

**Solutions**:
1. Reduce TTL for less critical data
2. Call `clearAllCache()` on route changes
3. Disable real-time updates for rarely changing data
4. Monitor cache size with `getCacheStats()`

### Listener Not Cleaning Up

**Problem**: Console warnings about memory leaks.

**Solution**: Hooks automatically clean up listeners. If using FirestoreCache directly, call `unregisterListener()`:

```javascript
useEffect(() => {
  const cacheKey = 'my-cache-key';
  const unsubscribe = onSnapshot(/* ... */);
  
  firestoreCache.registerListener(cacheKey, unsubscribe);
  
  return () => {
    firestoreCache.unregisterListener(cacheKey);
  };
}, []);
```

## Performance Impact

### Expected Improvements

- **Firebase Reads**: 60-80% reduction
- **App Load Time**: 30-50% faster
- **Network Usage**: 50-70% less
- **Battery Usage**: 20-30% improvement (mobile)

### Monitoring

Use Firebase Console to track read operations:

1. Go to Firestore → Usage tab
2. Monitor "Document Reads" metric
3. Compare before/after cache implementation
4. Aim for 70%+ reduction in reads

## Future Enhancements

- [ ] IndexedDB persistence for offline support
- [ ] Cache size limits with LRU eviction
- [ ] Automatic prefetching based on usage patterns
- [ ] Cache warming on app startup
- [ ] Background cache refresh
- [ ] Cache compression for large documents
- [ ] TypeScript types for all hooks

## Support

For issues or questions:
1. Check this documentation
2. Review cache statistics with `logCacheStats()`
3. Check browser console for errors
4. Review Firestore security rules
5. Test with cache disabled to isolate issues

## License

Part of the SuperChat project - Internal documentation
