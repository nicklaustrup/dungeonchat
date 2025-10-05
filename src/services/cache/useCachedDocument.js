import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import firestoreCache from './FirestoreCache';

/**
 * Cached Firestore Document Hook
 *
 * Provides automatic caching for Firestore document reads with real-time updates
 * Now with synchronous cache checking for better performance
 * 
 * @param {object} firestore - Firestore instance
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {object} options - Configuration options
 * @param {number} options.ttl - Time to live in milliseconds (default: 5 minutes)
 * @param {boolean} options.realtime - Enable real-time updates (default: false)
 * @param {boolean} options.disabled - Disable fetching (default: false)
 * 
 * @returns {object} { data, loading, error, refresh, invalidate }
 */
export function useCachedDocument(firestore, collection, docId, options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    realtime = false,
    disabled = false,
    collectionPath = null // Support for subcollections
  } = options;

  // Use collectionPath if provided (for subcollections), otherwise use collection
  const actualCollection = collectionPath || collection;
  const cacheKey = useMemo(
    () => `${actualCollection}/${docId}`.replace(/\//g, ':'),
    [actualCollection, docId]
  );

  // Check cache immediately on mount (synchronously before any effects run)
  const initialData = useMemo(() => {
    if (disabled || !docId) return null;
    return firestoreCache.get(cacheKey);
  }, [cacheKey, disabled, docId]);

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(initialData === null);
  const [error, setError] = useState(null);

  // Load document with caching
  const loadDocument = useCallback(async () => {
    if (!firestore || !docId || disabled) {
      setLoading(false);
      return;
    }

    // Use actualCollection instead of collection parameter
    const actualCollection = typeof collection === 'string' ? collection : collection?.id || collection?.path;
    
    if (!actualCollection) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first (synchronous check)
      const cachedData = firestoreCache.get(cacheKey);
      if (cachedData !== undefined) {
        console.log(
          '%c[CACHE] ✅ HIT',
          'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
          cacheKey
        );
        setData(cachedData);
        setLoading(false);
        return;
      }

      console.log(
        '%c[CACHE] ❌ MISS',
        'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
        cacheKey
      );

      const docRef = doc(firestore, actualCollection, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = { id: docSnap.id, ...docSnap.data() };
        firestoreCache.set(cacheKey, docData, ttl);
        setData(docData);
      } else {
        setData(null);
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(`Error loading ${actualCollection}/${docId}:`, err);
      setError(err);
      setLoading(false);
    }
  }, [firestore, collection, docId, cacheKey, ttl, disabled]);

  // Set up real-time listener if enabled
  useEffect(() => {
    if (!firestore || !docId || disabled || !realtime) {
      return;
    }

    const actualCollection = typeof collection === 'string' ? collection : collection?.id || collection?.path;
    
    if (!actualCollection) {
      return;
    }

    const docRef = doc(firestore, actualCollection, docId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const docData = { id: docSnap.id, ...docSnap.data() };

          // Update cache with real-time data
          console.log(
            '%c[CACHE] 🔄 REALTIME UPDATE',
            'background: #06b6d4; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
            cacheKey
          );
          firestoreCache.set(cacheKey, docData, ttl);
          setData(docData);
        } else {
          setData(null);
          firestoreCache.invalidate(cacheKey);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error in real-time listener for ${actualCollection}/${docId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Register listener for cleanup
    firestoreCache.registerListener(cacheKey, unsubscribe);

    return () => {
      firestoreCache.unregisterListener(cacheKey);
    };
  }, [firestore, collection, docId, cacheKey, ttl, realtime, disabled]);

  // Manual refresh function
  const refresh = useCallback(() => {
    firestoreCache.invalidate(cacheKey);
    return loadDocument();
  }, [cacheKey, loadDocument]);

  // Manual invalidate function
  const invalidate = useCallback(() => {
    firestoreCache.invalidate(cacheKey);
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate
  };
}

/**
 * Cached Firestore Query Hook
 * 
 * Provides automatic caching for Firestore queries with real-time updates
 * 
 * @param {object} firestore - Firestore instance
 * @param {function} queryFn - Function that returns a Firestore query
 * @param {string} cacheKey - Unique cache key for this query
 * @param {object} options - Configuration options
 * 
 * @returns {object} { data, loading, error, refresh, invalidate }
 */
export function useCachedQuery(firestore, queryFn, cacheKey, options = {}) {
  const {
    ttl = 5 * 60 * 1000,
    realtime = false,
    disabled = false
  } = options;

  // Check cache immediately on mount (synchronously before any effects run)
  const initialData = useMemo(() => {
    if (disabled) {
      console.log(
        '%c[CACHE] ⏸️ QUERY DISABLED',
        'background: #64748b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
        cacheKey
      );
      return [];
    }
    const cached = firestoreCache.get(cacheKey);
    console.log(
      `%c[CACHE] 📋 QUERY INIT`,
      'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      cacheKey,
      cached ? `${cached.length} items from cache` : 'no cache'
    );
    return cached !== null ? cached : [];
  }, [cacheKey, disabled]);

  const [data, setData] = useState(initialData);
  // Set loading if we have no cached data AND not disabled
  // But keep loading true if currently disabled (waiting for auth)
  const [loading, setLoading] = useState(disabled || initialData.length === 0);
  const [error, setError] = useState(null);

  // Load query with caching
  const loadQuery = useCallback(async () => {
    if (disabled || !firestore || !queryFn) {
      // Don't set loading to false if disabled - we're waiting for auth
      if (!disabled) {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = firestoreCache.get(cacheKey);
      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Cache miss - fetch from Firestore
      const q = queryFn();
      const snapshot = await getDocs(q);

      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cache the results
      firestoreCache.set(cacheKey, results, ttl);
      setData(results);
    } catch (err) {
      console.error(`Error loading query ${cacheKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [firestore, queryFn, cacheKey, ttl, disabled]);

  // Setup real-time listener
  useEffect(() => {
    if (!realtime || disabled || !firestore || !queryFn) {
      if (!realtime) {
        loadQuery();
      }
      return;
    }

    console.log(
      '%c[CACHE] 🔄 REALTIME SETUP',
      'background: #06b6d4; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      cacheKey
    );

    const q = queryFn();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Update cache with real-time data
        console.log(
          '%c[CACHE] 🔄 REALTIME UPDATE',
          'background: #06b6d4; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
          cacheKey,
          `${results.length} items`
        );
        firestoreCache.set(cacheKey, results, ttl);
        setData(results);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error in real-time listener for query ${cacheKey}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Register listener for cleanup
    firestoreCache.registerListener(cacheKey, unsubscribe);

    return () => {
      firestoreCache.unregisterListener(cacheKey);
    };
  }, [firestore, queryFn, cacheKey, ttl, realtime, disabled, loadQuery]);

  // Manual refresh function
  const refresh = useCallback(() => {
    firestoreCache.invalidate(cacheKey);
    return loadQuery();
  }, [cacheKey, loadQuery]);

  // Manual invalidate function
  const invalidate = useCallback(() => {
    firestoreCache.invalidate(cacheKey);
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate
  };
}

export default useCachedDocument;
