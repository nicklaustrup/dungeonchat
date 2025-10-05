/**
 * Firestore Cache Service
 * Provides intelligent caching layer for Firebase Firestore reads
 * 
 * Features:
 * - In-memory caching with TTL (Time To Live)
 * - Field-level cache invalidation
 * - Automatic cache cleanup
 * - Real-time listener support
 * - Cache statistics and monitoring
 */

class FirestoreCache {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      evictions: 0
    };
    
    // Default TTL: 5 minutes
    this.defaultTTL = 5 * 60 * 1000;
    
    // Start cleanup interval (every minute)
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from collection and document ID
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   * @param {string} field - Optional field name for field-level caching
   */
  generateKey(collection, docId, field = null) {
    return field 
      ? `${collection}:${docId}:${field}`
      : `${collection}:${docId}`;
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any} Cached data or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    });
  }

  /**
   * Invalidate cache entry
   * @param {string} key - Cache key or pattern
   */
  invalidate(key) {
    // If key contains wildcard, invalidate matching keys
    if (key.includes('*')) {
      const pattern = new RegExp(key.replace('*', '.*'));
      let count = 0;
      
      for (const cacheKey of this.cache.keys()) {
        if (pattern.test(cacheKey)) {
          this.cache.delete(cacheKey);
          count++;
        }
      }
      
      this.stats.invalidations += count;
      return count;
    }
    
    // Single key invalidation
    if (this.cache.delete(key)) {
      this.stats.invalidations++;
      return 1;
    }
    
    return 0;
  }

  /**
   * Invalidate entire collection
   * @param {string} collection - Collection name
   */
  invalidateCollection(collection) {
    return this.invalidate(`${collection}:*`);
  }

  /**
   * Invalidate specific document
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   */
  invalidateDocument(collection, docId) {
    return this.invalidate(`${collection}:${docId}*`);
  }

  /**
   * Invalidate specific field
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   * @param {string} field - Field name
   */
  invalidateField(collection, docId, field) {
    const key = this.generateKey(collection, docId, field);
    return this.invalidate(key);
  }

  /**
   * Register a real-time listener
   * @param {string} key - Cache key
   * @param {function} unsubscribe - Firestore unsubscribe function
   */
  registerListener(key, unsubscribe) {
    this.listeners.set(key, unsubscribe);
  }

  /**
   * Unregister a real-time listener
   * @param {string} key - Cache key
   */
  unregisterListener(key) {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Clear all cache and listeners
   */
  clear() {
    // Unsubscribe all listeners
    for (const unsubscribe of this.listeners.values()) {
      unsubscribe();
    }
    
    this.cache.clear();
    this.listeners.clear();
    this.stats.invalidations += this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      listeners: this.listeners.size,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      evictions: 0
    };
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let evicted = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          evicted++;
        }
      }
      
      if (evicted > 0) {
        this.stats.evictions += evicted;
        console.log(`[FirestoreCache] Evicted ${evicted} expired entries`);
      }
    }, 60000); // Run every minute
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create singleton instance
const firestoreCache = new FirestoreCache();

// Export both the class and singleton
export { FirestoreCache };
export default firestoreCache;
