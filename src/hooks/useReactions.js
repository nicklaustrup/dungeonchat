import { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * useReactions
 * Handles optimistic local reaction state and persists the final structure to Firestore.
 * Ensures removal of empty arrays cleans up the reaction key and writes an empty object when all cleared.
 */
export function useReactions({ firestore, auth, messageId, initialReactions = {} }) {
  const [reactions, setReactions] = useState(initialReactions);

  const toggleReaction = useCallback(async (emoji) => {
    if (!messageId || !auth?.currentUser) return;
    let nextState; // capture computed next reactions
    setReactions(prev => {
      const next = { ...prev };
      const uid = auth.currentUser.uid;
      if (!next[emoji]) next[emoji] = [];
      if (typeof next[emoji] === 'number') next[emoji] = []; // defensive migration
      const arr = next[emoji];
      const idx = arr.indexOf(uid);
      if (idx > -1) {
        arr.splice(idx, 1);
        if (arr.length === 0) delete next[emoji];
      } else {
        arr.push(uid);
      }
      nextState = next;
      return next;
    });
    try {
      const ref = doc(firestore, 'messages', messageId);
      // Persist updated reactions (or {} if empty)
      await updateDoc(ref, { reactions: nextState && Object.keys(nextState).length ? nextState : {} });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('❌ Reaction update failed', e);
    }
  }, [messageId, auth, firestore]);

  return { reactions, toggleReaction };
}

export default useReactions;
