# Firebase Cache System Audit Report

## Issues Found & Fixed

### 1. **Missing `invalidatePattern()` Method** ❌ → ✅
- **Problem**: Code was calling `firestoreCache.invalidatePattern()` which didn't exist
- **Impact**: Cache invalidation for patterns (like `maps/campaign/*`) was failing silently
- **Fix**: Added `invalidatePattern()` method as an alias to `invalidate()` for better readability
- **Location**: `src/services/cache/FirestoreCache.js:127-129`

### 2. **Subcollection Path Not Supported** ❌ → ✅
- **Problem**: `useCachedDocument` ignored the `collectionPath` option for subcollections
- **Impact**: Maps and other subcollection items weren't being cached correctly
- **Example**: `campaigns/abc123/maps/map456` was being treated as `maps/map456`
- **Fix**: Added support for `collectionPath` option and proper path splitting
- **Location**: `src/services/cache/useCachedDocument.js:25, 33-34, 57-58, 94-95`

### 3. **No Cache Operation Visibility** ❌ → ✅
- **Problem**: No logging for cache operations, impossible to debug
- **Impact**: Couldn't tell if cache was working or why it was missing
- **Fix**: Added comprehensive color-coded console logging for all cache operations

## Cache Logging System

The cache now logs all operations with color-coded messages:

### Initialization
- 🚀 **INITIALIZED** (Purple) - Cache system startup

### Cache Operations
- 🎯 **HIT** (Green) - Data found in cache
- ❌ **MISS** (Red) - Data not in cache, fetching from Firestore
- 💾 **SET** (Blue) - Data stored in cache
- ⏰ **EXPIRED** (Orange) - Cache entry expired, fetching fresh data

### Real-time Updates
- 🔄 **REALTIME SETUP** (Cyan) - Real-time listener registered
- 🔄 **REALTIME UPDATE** (Cyan) - Real-time data update received
- 👂 **LISTENER REGISTERED** (Cyan) - Listener attached to cache key
- 🔇 **LISTENER UNREGISTERED** (Gray) - Listener cleaned up

### Cache Invalidation
- 🗑️ **INVALIDATE** (Orange) - Single cache entry removed
- 🗑️ **INVALIDATE PATTERN** (Orange) - Multiple cache entries removed by pattern
- 🗑️ **EVICT** (Orange) - Expired entries automatically removed

## How to Debug Cache Issues

### 1. Check Cache Stats
```javascript
// In browser console
window.firestoreCache.getStats()
// Returns: { hits, misses, hitRate, invalidations, evictions, size, listeners }

// Or use formatted logging
window.logCacheStats()
```

### 2. Monitor Console Logs
Open DevTools console and look for cache messages:
- **Green (HIT)**: Cache is working! ✅
- **Red (MISS)**: First load or cache expired
- **Cyan (REALTIME)**: Real-time updates active
- **Orange (INVALIDATE)**: Cache being cleared

### 3. Expected Behavior

#### First Page Load
```
[CACHE] 🚀 INITIALIZED - Default TTL: 300s
[CACHE] ❌ MISS - userProfiles/uid123
[CACHE] 💾 SET - userProfiles/uid123 (TTL: 300s)
[CACHE] 🔄 REALTIME SETUP - userProfiles/uid123
[CACHE] 👂 LISTENER REGISTERED - userProfiles/uid123
```

#### Navigating Between Pages (Cache Working)
```
[CACHE] 🎯 HIT - userProfiles/uid123
[CACHE] 🎯 HIT - campaigns:joined:uid123
```

#### Real-time Update Received
```
[CACHE] 🔄 REALTIME UPDATE - userProfiles/uid123
[CACHE] 💾 SET - userProfiles/uid123 (TTL: 300s)
```

#### Cache Invalidation
```
[CACHE] 🗑️ INVALIDATE PATTERN - maps/campaign/abc123 (3 entries)
```

### 4. Common Issues to Check

#### Profile Picture Always Fetching
- **Look for**: Repeated `MISS` for `userProfiles/uid`
- **Check**: Is real-time enabled? Should see `REALTIME SETUP`
- **Verify**: TTL not too short (default 5min = 300s)

#### Campaigns Refetching
- **Look for**: `MISS` on `campaigns/joined/uid` or `campaigns/created/uid`
- **Check**: Cache keys match between loads
- **Verify**: Not being invalidated unnecessarily

#### Maps Not Caching
- **Look for**: `MISS` on `campaigns:campaignId:maps:mapId`
- **Check**: Subcollection path is correct
- **Verify**: `collectionPath` option is used

## Cache Configuration

### Current TTL Settings
- **User Profiles**: 5 minutes (300s)
- **Campaigns**: 5 minutes (300s)
- **Characters**: 5 minutes (300s)
- **Maps**: 10 minutes (600s)

### Real-time Updates
All caches have `realtime: true` by default, meaning:
- Initial load uses cache if available
- Background listener keeps cache updated
- No manual invalidation needed for most updates

### Cache Keys Format
- Simple documents: `collection:docId`
- Subcollections: `parent:parentId:collection:docId`
- Queries: Custom key like `campaigns/joined/userId`

## Testing Checklist

- [ ] Profile picture loads from cache on page change
- [ ] Campaigns list shows cached data immediately
- [ ] Characters load from cache when switching tabs
- [ ] Maps use cached data in campaign view
- [ ] Real-time updates reflect in UI without refresh
- [ ] Cache stats show reasonable hit rate (>50%)
- [ ] No excessive MISS logs during normal navigation

## Next Steps

1. **Monitor the console** during normal app usage
2. **Check hit rate** after 5-10 minutes: `window.getCacheStats()`
3. **Look for patterns** in MISS logs - these indicate cache problems
4. **Verify real-time listeners** are active for frequently accessed data
5. **Adjust TTLs** if data becomes stale or cache misses are too frequent
