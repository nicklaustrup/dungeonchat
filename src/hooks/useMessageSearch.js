import React from 'react';

/**
 * useMessageSearch
 * Lightweight filtering of messages by text content. Images are always included so they can be discovered.
 * Performs case-insensitive substring match. Returns original array when searchTerm falsy.
 *
 * @param {Array} messages - Chronological messages (stable reference best-effort)
 * @param {string} searchTerm
 * @returns {Array}
 */
export function useMessageSearch(messages, searchTerm) {
  return React.useMemo(() => {
    if (!messages) return [];
    if (!searchTerm) return messages;
    const term = searchTerm.toLowerCase();
    return messages.filter(msg => {
      if (msg.type === 'image') return true; // always show images
      if (!msg.text || typeof msg.text !== 'string') return false;
      return msg.text.toLowerCase().includes(term);
    });
  }, [messages, searchTerm]);
}

export default useMessageSearch;