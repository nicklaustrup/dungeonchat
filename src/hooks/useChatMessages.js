import React from 'react';
import { collection, query, orderBy, limit as fsLimit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';

/**
 * useChatMessages
 * Handles Firestore message retrieval with incremental limit, normalization, and ordering.
 * Messages are returned in chronological (oldest -> newest) order.
 *
 * @param {Object} params
 * @param {import('firebase/firestore').Firestore} params.firestore
 * @param {number} [params.limitBatchSize=25]
 * @param {number} [params.maxLimit=100]
 * @returns {{ messages: Array, loadMore: Function, hasMore: boolean, isInitialLoading: boolean, currentLimit: number }}
 */
export function useChatMessages({ firestore, limitBatchSize = 25, maxLimit = 100 } = {}) {
  const [messageLimit, setMessageLimit] = React.useState(limitBatchSize);
  const messagesRef = React.useMemo(() => collection(firestore, 'messages'), [firestore]);
  const q = React.useMemo(() => query(messagesRef, orderBy('createdAt', 'desc'), fsLimit(messageLimit)), [messagesRef, messageLimit]);
  const [snapshot, loading, error] = useCollection(q);

  const messages = React.useMemo(() => {
    if (!snapshot) return [];
    // Reverse to chronological order after fetching desc
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .reverse();
  }, [snapshot]);

  const isInitialLoading = loading && messageLimit === limitBatchSize;
  // If we fetched fewer docs than requested limit, no more (heuristic)
  const hasMore = React.useMemo(() => messages.length >= messageLimit && messageLimit < maxLimit, [messages.length, messageLimit, maxLimit]);

  const loadMore = React.useCallback(() => {
    setMessageLimit(prev => {
      if (prev >= maxLimit) return prev;
      return Math.min(prev + limitBatchSize, maxLimit);
    });
  }, [limitBatchSize, maxLimit]);

  if (error && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[useChatMessages] Firestore error:', error);
  }

  return { messages, loadMore, hasMore, isInitialLoading, currentLimit: messageLimit };
}

export default useChatMessages;