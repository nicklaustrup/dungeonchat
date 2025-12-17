/**
 * useCharacterCache Hook
 * Caches character sheet data to prevent repeated Firebase reads
 * Automatically invalidates cache when character is updated
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Global cache shared across all hook instances
const characterCache = new Map();
const cacheTimestamps = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache listeners (for real-time updates)
const cacheListeners = new Map();

export function useCharacterCache(firestore, campaignId, userId) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Generate cache key
  const cacheKey = `${campaignId}:${userId}`;

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!characterCache.has(cacheKey)) return false;
    const timestamp = cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  }, [cacheKey]);

  // Invalidate cache entry
  const invalidateCache = useCallback(() => {
    console.log("🗑️ useCharacterCache: Invalidating cache for:", cacheKey);
    characterCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
  }, [cacheKey]);

  // Load character with caching
  useEffect(() => {
    if (!firestore || !campaignId || !userId) {
      setLoading(false);
      return;
    }

    const loadCharacter = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        if (isCacheValid()) {
          console.log("✅ useCharacterCache: Cache hit for:", cacheKey);
          const cachedData = characterCache.get(cacheKey);
          setCharacter(cachedData);
          setLoading(false);
          return;
        }

        console.log(
          "📥 useCharacterCache: Cache miss, fetching from Firebase:",
          cacheKey
        );

        const characterRef = doc(
          firestore,
          "campaigns",
          campaignId,
          "characters",
          userId
        );
        const docSnap = await getDoc(characterRef);

        if (docSnap.exists()) {
          const charData = docSnap.data();

          // Store in cache
          characterCache.set(cacheKey, charData);
          cacheTimestamps.set(cacheKey, Date.now());
          console.log("💾 useCharacterCache: Cached character data:", cacheKey);

          setCharacter(charData);

          // Set up real-time listener for updates
          if (!cacheListeners.has(cacheKey)) {
            console.log(
              "👂 useCharacterCache: Setting up real-time listener:",
              cacheKey
            );
            const unsubscribe = onSnapshot(
              characterRef,
              (snapshot) => {
                if (snapshot.exists()) {
                  const updatedData = snapshot.data();
                  console.log(
                    "🔄 useCharacterCache: Real-time update received:",
                    cacheKey
                  );

                  // Update cache
                  characterCache.set(cacheKey, updatedData);
                  cacheTimestamps.set(cacheKey, Date.now());

                  // Update all components using this character
                  setCharacter(updatedData);
                }
              },
              (err) => {
                console.error("❌ useCharacterCache: Listener error:", err);
              }
            );

            cacheListeners.set(cacheKey, unsubscribe);
            unsubscribeRef.current = unsubscribe;
          }
        } else {
          setError("Character not found");
        }
      } catch (err) {
        console.error("❌ useCharacterCache: Error loading character:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();

    // Cleanup: Don't unsubscribe (keep listener active for cache)
    return () => {
      // Individual components unmounting don't kill the listener
      // Listener stays active as long as at least one component needs it
    };
  }, [firestore, campaignId, userId, cacheKey, isCacheValid]);

  // Update character in cache (for optimistic updates)
  const updateCharacter = useCallback(
    (updates) => {
      if (!character) return;

      const updatedChar = { ...character, ...updates };

      // Update local state
      setCharacter(updatedChar);

      // Update cache
      characterCache.set(cacheKey, updatedChar);
      cacheTimestamps.set(cacheKey, Date.now());

      console.log("🔄 useCharacterCache: Optimistic update applied:", cacheKey);
    },
    [character, cacheKey]
  );

  return {
    character,
    loading,
    error,
    invalidateCache,
    updateCharacter,
    isCached: isCacheValid(),
  };
}

// Utility to manually clear all cache
export function clearAllCharacterCache() {
  console.log("🗑️ useCharacterCache: Clearing all cache");

  // Unsubscribe all listeners
  cacheListeners.forEach((unsubscribe) => {
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }
  });

  characterCache.clear();
  cacheTimestamps.clear();
  cacheListeners.clear();
}

// Utility to clear specific character cache
export function clearCharacterCache(campaignId, userId) {
  const cacheKey = `${campaignId}:${userId}`;
  console.log("🗑️ useCharacterCache: Clearing cache for:", cacheKey);

  // Unsubscribe listener
  const unsubscribe = cacheListeners.get(cacheKey);
  if (unsubscribe && typeof unsubscribe === "function") {
    unsubscribe();
  }

  characterCache.delete(cacheKey);
  cacheTimestamps.delete(cacheKey);
  cacheListeners.delete(cacheKey);
}
