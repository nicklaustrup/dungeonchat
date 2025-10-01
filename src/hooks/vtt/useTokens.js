import { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../../services/FirebaseContext';
import { tokenService } from '../../services/vtt/tokenService';

/**
 * useTokens - Manage tokens for a specific map
 * Provides real-time sync with Firestore and local state management
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

        // Set up real-time listener
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

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [campaignId, mapId, firestore]);

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
