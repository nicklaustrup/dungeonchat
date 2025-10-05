import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import firestoreCache from './FirestoreCache';

/**
 * Cached Firestore Document Hook
 * 
 * Provides automatic caching for Firestore document reads with real-time updates
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
    disabled = false
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheKey = firestoreCache.generateKey(collection, docId);

  // Load document with caching
  const loadDocument = useCallback(async () => {
    if (disabled || !firestore || !docId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = firestoreCache.get(cacheKey);
      if (cached !== null) {
        console.warn('%c[CACHE] 🎯 HIT', 'background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold', cacheKey);
        setData(cached);
        setLoading(false);
        return;
      }

      console.warn('%c[CACHE] ❌ MISS', 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold', cacheKey);
      // Cache miss - fetch from Firestore
      const docRef = doc(firestore, collection, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = { id: docSnap.id, ...docSnap.data() };
        
        // Cache the result
        firestoreCache.set(cacheKey, docData, ttl);
        console.log('%c[CACHE] 💾 SET', 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold', cacheKey);
        setData(docData);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error(`Error loading document ${collection}/${docId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [firestore, collection, docId, cacheKey, ttl, disabled]);

  // Setup real-time listener
  useEffect(() => {
    if (!realtime || disabled || !firestore || !docId) {
      // If not real-time, just load once
      if (!realtime) {
        loadDocument();
      }
      return;
    }

    const docRef = doc(firestore, collection, docId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const docData = { id: docSnap.id, ...docSnap.data() };
          
          // Update cache with real-time data
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
        console.error(`Error in real-time listener for ${collection}/${docId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Register listener for cleanup
    firestoreCache.registerListener(cacheKey, unsubscribe);

    return () => {
      firestoreCache.unregisterListener(cacheKey);
    };
  }, [firestore, collection, docId, cacheKey, ttl, realtime, disabled, loadDocument]);

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

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load query with caching
  const loadQuery = useCallback(async () => {
    if (disabled || !firestore || !queryFn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = firestoreCache.get(cacheKey);
      if (cached !== null) {
        console.log('%c[CACHE] 🎯 HIT', 'background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold', cacheKey);
        setData(cached);
        setLoading(false);
        return;
      }

      console.warn('%c[CACHE] ❌ MISS', 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold', cacheKey);
      // Cache miss - fetch from Firestore
      const q = queryFn();
      const snapshot = await getDocs(q);

      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cache the results
      firestoreCache.set(cacheKey, results, ttl);
      console.log('%c[CACHE] 💾 SET', 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold', cacheKey);
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

    const q = queryFn();
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Update cache with real-time data
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
