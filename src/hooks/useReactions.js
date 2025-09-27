import { useState, useCallback, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * useReactions
 * Handles optimistic local reaction state and persists the final structure to Firestore.
 * Ensures removal of empty arrays cleans up the reaction key and writes an empty object when all cleared.
 */
export function useReactions({ firestore, auth, messageId, initialReactions = {} }) {
  const [reactions, setReactions] = useState(initialReactions);

  // Keep local state in sync with upstream Firestore updates so other users' reactions appear.
  useEffect(() => {
    // Only update if the initialReactions reference actually changed and is different from current state
    setReactions(prevState => {
      // Deep comparison to avoid unnecessary updates that could cause infinite loops
      const initialKeys = Object.keys(initialReactions || {});
      const prevKeys = Object.keys(prevState || {});
      
      // Quick equality check - if key counts differ, definitely not equal
      if (initialKeys.length !== prevKeys.length) {
        return initialReactions || {};
      }
      
      // Check if any keys or values differ
      for (const key of initialKeys) {
        const initialArray = initialReactions[key] || [];
        const prevArray = prevState[key] || [];
        
        // Quick length check
        if (!prevState[key] || initialArray.length !== prevArray.length) {
          return initialReactions || {};
        }
        
        // For small arrays, a full comparison is reasonable
        if (!initialArray.every((id, i) => prevArray[i] === id)) {
          return initialReactions || {};
        }
      }
      
      // If we get here, the objects are equivalent, so keep current state
      return prevState;
    });
  }, [initialReactions]);

  const toggleReaction = useCallback(async (emoji) => {
    if (!messageId || !auth?.currentUser) return;
    
    // First compute the new state so we have it for both local update and Firestore
    const uid = auth.currentUser.uid;
    let nextState = { ...reactions }; // Start from current state
    
    if (!nextState[emoji]) nextState[emoji] = [];
    if (typeof nextState[emoji] === 'number') nextState[emoji] = []; // defensive migration
    
    const arr = [...nextState[emoji]]; // Create a new array to avoid mutations
    const idx = arr.indexOf(uid);
    
    if (idx > -1) {
      arr.splice(idx, 1);
      if (arr.length === 0) {
        const cleanState = { ...nextState };
        delete cleanState[emoji];
        nextState = cleanState;
      } else {
        nextState[emoji] = arr;
      }
    } else {
      arr.push(uid);
      nextState[emoji] = arr;
    }
    
    // Update local state immediately (optimistic update)
    setReactions(nextState);
    
    try {
      const ref = doc(firestore, 'messages', messageId);
      // Only update the specific emoji that changed rather than the whole reactions object
      // This prevents race conditions and overwriting other reactions
      let updatePayload;
      if (idx > -1 && arr.length === 0) {
        // Remove the emoji key entirely when last user removed their reaction
        updatePayload = { [`reactions.${emoji}`]: [] };
      } else {
        // Update only this specific emoji's reactions
        updatePayload = { [`reactions.${emoji}`]: nextState[emoji] || [] };
      }
      
      await updateDoc(ref, updatePayload);
      return nextState; // Return the updated state
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('❌ Reaction update failed', e);
      // Revert optimistic update on error
      setReactions(reactions);
      throw e; // Re-throw for proper error handling
    }
  }, [messageId, auth, firestore, reactions]);

  return { reactions, toggleReaction };
}

export default useReactions;
