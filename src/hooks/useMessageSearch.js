import React from "react";

/**
 * useMessageSearch
 * Optimized filtering of messages by text content with memoization and caching.
 * Performs case-insensitive substring match. Returns original array when searchTerm falsy.
 *
 * @param {Array} messages - Chronological messages (stable reference best-effort)
 * @param {string} searchTerm
 * @returns {Array}
 */
export function useMessageSearch(messages, searchTerm) {
  // Cache search results to avoid re-filtering when messages reference is the same
  const searchCacheRef = React.useRef(new Map());

  return React.useMemo(() => {
    if (!messages) return [];
    if (!searchTerm) {
      // Clear cache when no search term to prevent memory leaks
      searchCacheRef.current.clear();
      return messages;
    }

    const term = searchTerm.toLowerCase();
    const cacheKey = `${messages.length}-${term}`;

    // Check cache first
    if (searchCacheRef.current.has(cacheKey)) {
      return searchCacheRef.current.get(cacheKey);
    }

    const filtered = messages.filter((msg) => {
      if (!msg.text || typeof msg.text !== "string") return false;
      return msg.text.toLowerCase().includes(term);
    });

    // Cache result (limit cache size to prevent memory issues)
    if (searchCacheRef.current.size > 10) {
      searchCacheRef.current.clear();
    }
    searchCacheRef.current.set(cacheKey, filtered);

    return filtered;
  }, [messages, searchTerm]);
}

export default useMessageSearch;
