import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { FirebaseContext } from '../../services/FirebaseContext';
import { tokenService } from '../../services/vtt/tokenService';

/**
 * useTokens - Manage tokens for a specific map
 * Provides real-time sync with Firestore and local state management
 * Includes automatic HP syncing from character sheets (source of truth)
 * 
 * @param {string} campaignId - Campaign ID
 * @param {string} mapId - Map ID
 * @returns {object} - { tokens, loading, error, addToken, updateToken, removeToken, refreshTokens }
 */
const useTokens = (campaignId, mapId) => {
  const { firestore } = useContext(FirebaseContext);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track character listeners to avoid duplicates
  const characterListenersRef = useRef(new Map());
  
  /**
   * Set up character HP listeners for tokens linked to characters
   * When character HP changes, automatically sync to all linked tokens
   */
  const setupCharacterListeners = useCallback(async (tokenList) => {
    if (!firestore || !campaignId || !mapId) return;
    
    console.log('🟣 useTokens.setupCharacterListeners: Setting up listeners for', tokenList.length, 'tokens');
    
    try {
      const { doc: firestoreDoc, onSnapshot } = await import('firebase/firestore');
      
      // Get unique character/user combinations from tokens
      const characterKeys = new Set();
      tokenList.forEach(token => {
        if (token.characterId && token.userId) {
          const key = `${token.userId}`;
          characterKeys.add(key);
        }
      });

      console.log('🟣 useTokens.setupCharacterListeners: Found', characterKeys.size, 'unique characters with linked tokens');
      
      // Remove listeners for characters that no longer have tokens
      characterListenersRef.current.forEach((unsubscribe, key) => {
        if (!characterKeys.has(key)) {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
          characterListenersRef.current.delete(key);
        }
      });
      
      // Add listeners for new characters
      characterKeys.forEach(key => {
        if (characterListenersRef.current.has(key)) return; // Already listening
        
        const userId = key;
        const characterRef = firestoreDoc(firestore, 'campaigns', campaignId, 'characters', userId);
        
        const unsubscribe = onSnapshot(
          characterRef,
          (snapshot) => {
            if (!snapshot.exists()) return;
            
            const characterData = snapshot.data();
            
            console.log('🟣 useTokens: Character HP changed:', {
              userId,
              characterName: characterData.name,
              hp: characterData.hp,
              maxHp: characterData.maxHp
            });
            
            // Find all tokens linked to this character and update their HP
            const linkedTokens = tokenList.filter(
              token => token.userId === userId && token.characterId
            );
            
            console.log('🟣 useTokens: Found linked tokens:', linkedTokens.length, linkedTokens.map(t => ({
              id: t.id,
              name: t.name,
              hp: t.hp
            })));
            
            linkedTokens.forEach(token => {
              // Sync token HP from character (don't trigger updateHP to avoid circular updates)
              tokenService.syncTokenHPFromCharacter(
                firestore,
                campaignId,
                mapId,
                token.id,
                characterData
              );
            });
          },
          (err) => {
            console.error('❌ useTokens: Error listening to character HP:', err);
          }
        );
        
        characterListenersRef.current.set(key, unsubscribe);
      });
    } catch (err) {
      console.error('Error setting up character listeners:', err);
    }
  }, [firestore, campaignId, mapId]);

  // Load tokens on mount
  useEffect(() => {
    if (!campaignId || !mapId || !firestore) {
      setLoading(false);
      return;
    }

    let unsubscribe;

    const setupRealtimeListener = async () => {
      try {
        setLoading(true);
        setError(null);

        // Import Firestore functions
        const { collection, query, onSnapshot } = await import('firebase/firestore');

        // Create query for tokens
        const tokensRef = collection(
          firestore,
          'campaigns',
          campaignId,
          'vtt',
          mapId,
          'tokens'
        );
        const tokensQuery = query(tokensRef);

        // Set up real-time listener for tokens
        unsubscribe = onSnapshot(
          tokensQuery,
          (snapshot) => {
            const tokenList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Sort by creation date
            tokenList.sort((a, b) => {
              const aDate = a.createdAt?.toDate?.() || new Date(0);
              const bDate = b.createdAt?.toDate?.() || new Date(0);
              return aDate - bDate;
            });

            setTokens(tokenList);
            setLoading(false);
            
            // Set up character HP listeners for linked tokens
            setupCharacterListeners(tokenList);
          },
          (err) => {
            console.error('Error listening to tokens:', err);
            setError(err.message || 'Failed to load tokens');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error setting up token listener:', err);
        setError(err.message || 'Failed to initialize token listener');
        setLoading(false);
      }
    };

    setupRealtimeListener();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      
      // Clean up all character listeners
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const listenersToCleanup = characterListenersRef.current;
      listenersToCleanup.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      listenersToCleanup.clear();
    };
  }, [campaignId, mapId, firestore, setupCharacterListeners]);

  // Add a new token (optimistic update)
  const addToken = (token) => {
    setTokens((prev) => [...prev, token]);
  };

  // Update a token (optimistic update)
  const updateToken = (tokenId, updates) => {
    setTokens((prev) =>
      prev.map((token) =>
        token.id === tokenId ? { ...token, ...updates } : token
      )
    );
  };

  // Remove a token (optimistic update)
  const removeToken = (tokenId) => {
    setTokens((prev) => prev.filter((token) => token.id !== tokenId));
  };

  // Refresh tokens manually (if needed)
  const refreshTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      const tokenList = await tokenService.getTokens(firestore, campaignId, mapId);
      setTokens(tokenList);
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing tokens:', err);
      setError(err.message || 'Failed to refresh tokens');
      setLoading(false);
    }
  };

  return {
    tokens,
    loading,
    error,
    addToken,
    updateToken,
    removeToken,
    refreshTokens,
  };
};

export default useTokens;
