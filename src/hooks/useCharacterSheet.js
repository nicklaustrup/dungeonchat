/**
 * Character Sheet Hook
 * Custom React hook for managing character sheet data and operations
 */

import { useState, useEffect, useCallback } from "react";
import {
  updateCharacterSheet,
  getCampaignCharacters,
  addExperience,
  updateHitPoints,
  deleteCharacterSheet,
} from "../services/characterSheetService";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * Hook for managing a single character sheet with real-time updates
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @returns {Object} Character sheet data and operations
 */
export function useCharacterSheet(firestore, campaignId, userId) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time listener for character sheet
  useEffect(() => {
    if (!firestore || !campaignId || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const characterRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "characters",
      userId
    );

    const unsubscribe = onSnapshot(
      characterRef,
      (doc) => {
        if (doc.exists()) {
          setCharacter({ id: doc.id, ...doc.data() });
        } else {
          setCharacter(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error listening to character sheet:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, campaignId, userId]);

  // Update character sheet
  const updateCharacter = useCallback(
    async (updates) => {
      try {
        setError(null);
        await updateCharacterSheet(firestore, campaignId, userId, updates);
        // Real-time listener will update the state
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [firestore, campaignId, userId]
  );

  // Add experience with level up handling
  const gainExperience = useCallback(
    async (xp) => {
      try {
        setError(null);
        const updatedCharacter = await addExperience(
          firestore,
          campaignId,
          userId,
          xp
        );
        return updatedCharacter;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [firestore, campaignId, userId]
  );

  // Update hit points
  const modifyHitPoints = useCallback(
    async (newCurrentHP, tempHP = null) => {
      try {
        setError(null);
        await updateHitPoints(
          firestore,
          campaignId,
          userId,
          newCurrentHP,
          tempHP
        );
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [firestore, campaignId, userId]
  );

  return {
    character,
    loading,
    error,
    updateCharacter,
    gainExperience,
    modifyHitPoints,
    hasCharacter: !!character,
  };
}

/**
 * Hook for managing all campaign characters
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @returns {Object} Campaign characters data and operations
 */
export function useCampaignCharacters(firestore, campaignId) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch campaign characters
  const fetchCharacters = useCallback(async () => {
    if (!firestore || !campaignId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const campaignCharacters = await getCampaignCharacters(
        firestore,
        campaignId
      );
      setCharacters(campaignCharacters);
      setError(null);
    } catch (err) {
      console.error("Error fetching campaign characters:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [firestore, campaignId]);

  // Initial fetch
  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Refresh characters
  const refreshCharacters = useCallback(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return {
    characters,
    loading,
    error,
    refreshCharacters,
  };
}

/**
 * Hook for character creation workflow
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @returns {Object} Character creation state and operations
 */
export function useCharacterCreation(firestore, campaignId, userId) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const createCharacter = useCallback(
    async (characterData) => {
      try {
        setCreating(true);
        setError(null);

        const { createCharacterSheet } =
          await import("../services/characterSheetService");
        const newCharacter = await createCharacterSheet(
          firestore,
          campaignId,
          userId,
          characterData
        );

        return newCharacter;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [firestore, campaignId, userId]
  );

  return {
    creating,
    error,
    createCharacter,
  };
}

/** Hook for deleting a character sheet
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @returns {Function} deleteCharacter function
 */
export function useDeleteCharacterSheet(firestore, campaignId) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const deleteCharacter = useCallback(
    async (characterUserId) => {
      try {
        setDeleting(true);
        setError(null);
        await deleteCharacterSheet(firestore, campaignId, characterUserId);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setDeleting(false);
      }
    },
    [firestore, campaignId]
  );

  return {
    deleting,
    error,
    deleteCharacter,
  };
}
