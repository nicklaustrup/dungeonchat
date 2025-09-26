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
export function useChatMessages({ firestore, limitBatchSize = 25, maxLimit = 100, preserveDuringPagination = true } = {}) {
  const [messageLimit, setMessageLimit] = React.useState(limitBatchSize);
  const messagesRef = React.useMemo(() => collection(firestore, 'messages'), [firestore]);
  const q = React.useMemo(() => query(messagesRef, orderBy('createdAt', 'desc'), fsLimit(messageLimit)), [messagesRef, messageLimit]);
  const [snapshot, loading, error] = useCollection(q);

  // We keep a stable copy of the last non-empty (or loaded) message list to avoid
  // a transient empty array when the limit increases and the new query is still loading.
  // Without this, downstream diff logic sees: [75 msgs] -> [] -> [100 msgs]
  // which looks like a reset + fresh hydrate and breaks scroll restoration (jumps & flicker).
  const stableMessagesRef = React.useRef([]);
  const [stableMessagesState, setStableMessagesState] = React.useState([]); // exposed for memo deps / rerenders
  const paginatingRef = React.useRef(false); // true between loadMore invocation and next snapshot arrival
  const previousHasMoreRef = React.useRef(true); // preserve sentinel visibility while paginating

  const computedMessages = React.useMemo(() => {
    if (!snapshot) return null; // explicitly distinguish 'no snapshot yet'
    const list = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .reverse();
    return list;
  }, [snapshot]);

  // Update stable storage only when we truly have a snapshot (even if empty)
  React.useEffect(() => {
    if (computedMessages) {
      stableMessagesRef.current = computedMessages;
      setStableMessagesState(computedMessages);
      paginatingRef.current = false; // pagination cycle complete
    }
  }, [computedMessages]);

  // Derive messages. Dependency on stableMessagesState triggers updates when snapshot commits.
  const messages = React.useMemo(() => {
    if (!preserveDuringPagination) return computedMessages || [];
    if (!computedMessages && stableMessagesRef.current.length) return stableMessagesRef.current;
    return computedMessages || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedMessages, preserveDuringPagination, stableMessagesState]);

  const isInitialLoading = loading && messageLimit === limitBatchSize && !stableMessagesRef.current.length;

  // Heuristic: If we received fewer docs than requested (AND query settled) there are no more.
  let hasMoreCandidate = (messages.length >= messageLimit) && messageLimit < maxLimit;
  // During in-flight pagination where snapshot not yet arrived, retain previous hasMore (avoid hiding sentinel & triggering layout thrash)
  if (!computedMessages && paginatingRef.current) {
    hasMoreCandidate = previousHasMoreRef.current;
  } else {
    previousHasMoreRef.current = hasMoreCandidate;
  }
  const hasMore = hasMoreCandidate;

  const loadMore = React.useCallback(() => {
    setMessageLimit(prev => {
      if (prev >= maxLimit) return prev;
      paginatingRef.current = true;
      return Math.min(prev + limitBatchSize, maxLimit);
    });
  }, [limitBatchSize, maxLimit]);

  if (error && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[useChatMessages] Firestore error:', error);
  }

  const totalReached = messageLimit >= maxLimit && !hasMore;
  // Dev-time diagnostic: warn once when we hit the artificial cap so integrators realize deeper history is truncated.
  const warnedRef = React.useRef(false);
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && totalReached && !warnedRef.current) {
      // eslint-disable-next-line no-console
      console.info(`[useChatMessages] Reached maxLimit=${maxLimit}. Older history is truncated. Increase REACT_APP_CHAT_MAX_HISTORY or maxLimit param to load more.`);
      warnedRef.current = true;
    }
  }, [totalReached, maxLimit]);

  return { messages, loadMore, hasMore, isInitialLoading, currentLimit: messageLimit, totalReached };
}

export default useChatMessages;