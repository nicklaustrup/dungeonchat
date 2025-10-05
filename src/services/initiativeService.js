import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

/**
 * Initiative Service - Manages combat initiative tracking for campaigns
 * Handles turn order, HP tracking, conditions, and combat state management
 */

export const initiativeService = {
  // Get reference to initiative document for a campaign
  getInitiativeRef: (firestore, campaignId) => {
    return doc(firestore, 'campaigns', campaignId, 'sessions', 'initiative');
  },

  // Ensure initiative document exists (idempotent)
  ensureInitiativeDocument: async (firestore, campaignId) => {
    const ref = initiativeService.getInitiativeRef(firestore, campaignId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const initialData = {
        combatants: [],
        currentTurn: 0,
        round: 1,
        isActive: false,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp()
      };
      await setDoc(ref, initialData);
      return initialData;
    }
    return snap.data();
  },

  // Initialize or get existing initiative data
  getInitiativeData: async (firestore, campaignId) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      const initiativeSnap = await getDoc(initiativeRef);
      
      if (initiativeSnap.exists()) {
        return initiativeSnap.data();
      } else {
        // Initialize empty initiative tracker
        const initialData = {
          combatants: [],
          currentTurn: 0,
          round: 1,
          isActive: false,
          createdAt: serverTimestamp(),
          lastModified: serverTimestamp()
        };
        
        await setDoc(initiativeRef, initialData);
        return initialData;
      }
    } catch (error) {
      console.error('Error getting initiative data:', error);
      throw new Error('Failed to load initiative data');
    }
  },

  // Add a combatant to initiative order
  addCombatant: async (firestore, campaignId, combatant) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(initiativeRef);
        let data;
        if (!snap.exists()) {
          data = {
            combatants: [],
            currentTurn: 0,
            round: 1,
            isActive: false,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp()
          };
        } else {
          data = snap.data();
        }
        const combatantsArr = data.combatants || [];
        // Prevent duplicate (same id) additions
        if (combatantsArr.some(c => c.id === combatant.id)) {
          return; // silently ignore duplicate
        }
        combatantsArr.push(combatant);
        tx.set(initiativeRef, { 
          ...data, 
          combatants: combatantsArr, 
          lastModified: serverTimestamp() 
        }, { merge: true });
      });
      return combatant;
    } catch (error) {
      console.error('Error adding combatant:', error);
      throw new Error('Failed to add combatant');
    }
  },

  // Remove a combatant from initiative order
  removeCombatant: async (firestore, campaignId, combatantId) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(initiativeRef);
        if (!snap.exists()) throw new Error('Initiative tracker not found');
        const data = snap.data();
        const updatedCombatants = (data.combatants || []).filter(c => c.id !== combatantId);
        let newCurrentTurn = data.currentTurn || 0;
        if (newCurrentTurn >= updatedCombatants.length && updatedCombatants.length > 0) newCurrentTurn = 0;
        tx.update(initiativeRef, {
          combatants: updatedCombatants,
            currentTurn: newCurrentTurn,
            lastModified: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error removing combatant:', error);
      throw new Error('Failed to remove combatant');
    }
  },

  // Update combatant HP
  updateCombatantHP: async (firestore, campaignId, combatantId, newHP) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(initiativeRef);
        if (!snap.exists()) throw new Error('Initiative tracker not found');
        const data = snap.data();
        const updated = (data.combatants || []).map(c => c.id === combatantId ? ({
          ...c,
          hp: Math.max(0, Math.min(newHP, c.maxHp || newHP))
        }) : c);
        tx.update(initiativeRef, { combatants: updated, lastModified: serverTimestamp() });
      });
    } catch (error) {
      console.error('Error updating HP:', error);
      throw new Error('Failed to update HP');
    }
  },

  // Add condition to combatant
  addCondition: async (firestore, campaignId, combatantId, condition) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(initiativeRef);
        if (!snap.exists()) throw new Error('Initiative tracker not found');
        const data = snap.data();
        const updated = (data.combatants || []).map(c => {
          if (c.id === combatantId) {
            const conds = c.conditions || [];
            if (!conds.includes(condition)) {
              return { ...c, conditions: [...conds, condition] };
            }
          }
          return c;
        });
        tx.update(initiativeRef, { combatants: updated, lastModified: serverTimestamp() });
      });
    } catch (error) {
      console.error('Error adding condition:', error);
      throw new Error('Failed to add condition');
    }
  },

  // Remove condition from combatant
  removeCondition: async (firestore, campaignId, combatantId, condition) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(initiativeRef);
        if (!snap.exists()) throw new Error('Initiative tracker not found');
        const data = snap.data();
        const updated = (data.combatants || []).map(c => c.id === combatantId ? ({
          ...c,
          conditions: (c.conditions || []).filter(cn => cn !== condition)
        }) : c);
        tx.update(initiativeRef, { combatants: updated, lastModified: serverTimestamp() });
      });
    } catch (error) {
      console.error('Error removing condition:', error);
      throw new Error('Failed to remove condition');
    }
  },

  // Start combat
  startCombat: async (firestore, campaignId) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      const initiativeSnap = await getDoc(initiativeRef);
      
      if (!initiativeSnap.exists()) {
        throw new Error('Initiative tracker not found');
      }
      
      const currentData = initiativeSnap.data();
      if (!currentData.combatants || currentData.combatants.length === 0) {
        throw new Error('No combatants added to initiative');
      }
      
      // Sort combatants by initiative (highest first)
      const sortedCombatants = [...currentData.combatants].sort((a, b) => b.initiative - a.initiative);
      
      await updateDoc(initiativeRef, {
        combatants: sortedCombatants,
        isActive: true,
        currentTurn: 0,
        round: 1,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error starting combat:', error);
      throw new Error('Failed to start combat');
    }
  },

  // End combat
  endCombat: async (firestore, campaignId) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      
      await updateDoc(initiativeRef, {
        isActive: false,
        currentTurn: 0,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending combat:', error);
      throw new Error('Failed to end combat');
    }
  },

  // Advance to next turn
  nextTurn: async (firestore, campaignId) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      const initiativeSnap = await getDoc(initiativeRef);
      
      if (!initiativeSnap.exists()) {
        throw new Error('Initiative tracker not found');
      }
      
      const currentData = initiativeSnap.data();
      if (!currentData.isActive) {
        throw new Error('Combat is not active');
      }
      
      const combatantsLength = currentData.combatants?.length || 0;
      if (combatantsLength === 0) {
        throw new Error('No combatants in initiative');
      }
      
      let newTurn = (currentData.currentTurn || 0) + 1;
      let newRound = currentData.round || 1;
      
      // If we've gone through all combatants, start new round
      if (newTurn >= combatantsLength) {
        newTurn = 0;
        newRound += 1;
      }
      
      await updateDoc(initiativeRef, {
        currentTurn: newTurn,
        round: newRound,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error advancing turn:', error);
      throw new Error('Failed to advance turn');
    }
  },

  // Go back to previous turn
  previousTurn: async (firestore, campaignId) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      const initiativeSnap = await getDoc(initiativeRef);
      
      if (!initiativeSnap.exists()) {
        throw new Error('Initiative tracker not found');
      }
      
      const currentData = initiativeSnap.data();
      if (!currentData.isActive) {
        throw new Error('Combat is not active');
      }
      
      const combatantsLength = currentData.combatants?.length || 0;
      if (combatantsLength === 0) {
        throw new Error('No combatants in initiative');
      }
      
      let newTurn = (currentData.currentTurn || 0) - 1;
      let newRound = currentData.round || 1;
      
      // If we go before first combatant, go to end of previous round
      if (newTurn < 0) {
        newTurn = combatantsLength - 1;
        newRound = Math.max(1, newRound - 1);
      }
      
      await updateDoc(initiativeRef, {
        currentTurn: newTurn,
        round: newRound,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error going back turn:', error);
      throw new Error('Failed to go back turn');
    }
  },

  // Set specific turn
  setTurn: async (firestore, campaignId, turnIndex) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      const initiativeSnap = await getDoc(initiativeRef);
      
      if (!initiativeSnap.exists()) {
        throw new Error('Initiative tracker not found');
      }
      
      const currentData = initiativeSnap.data();
      if (!currentData.isActive) {
        throw new Error('Combat is not active');
      }
      
      const combatantsLength = currentData.combatants?.length || 0;
      if (turnIndex < 0 || turnIndex >= combatantsLength) {
        throw new Error('Invalid turn index');
      }
      
      await updateDoc(initiativeRef, {
        currentTurn: turnIndex,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting turn:', error);
      throw new Error('Failed to set turn');
    }
  },

  // Clear all combatants
  clearCombatants: async (firestore, campaignId) => {
    try {
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      
      await updateDoc(initiativeRef, {
        combatants: [],
        currentTurn: 0,
        round: 1,
        isActive: false,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error clearing combatants:', error);
      throw new Error('Failed to clear combatants');
    }
  },

  // Subscribe to initiative changes
  subscribeToInitiative: (firestore, campaignId, callback) => {
    const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
    
    return onSnapshot(initiativeRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to initiative:', error);
      callback(null, error);
    });
  },

  // Helper function to calculate initiative modifier from character stats
  calculateInitiativeModifier: (character) => {
    if (!character?.abilityScores?.dexterity) return 0;
    
    const dexterity = character.abilityScores.dexterity;
    return Math.floor((dexterity - 10) / 2);
  },

  // Helper function to roll initiative for a character
  rollInitiativeForCharacter: (character) => {
    const modifier = initiativeService.calculateInitiativeModifier(character);
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + modifier;
  },

  /**
   * Begin an initiative collection phase.
   * - Ensures initiative document exists
   * - Auto-rolls initiative for all existing non-player (enemy/npc) combatants
   * - Resets turn/round/isActive flags
   * - Sets collectingInitiative=true so UI can prompt players to roll
   * Players then roll using /init in chat which will call recordPlayerInitiativeRoll
   */
  initiateInitiativeCheck: async (firestore, campaignId) => {
    try {
      const ref = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(ref);
        let data;
        if (!snap.exists()) {
          data = {
            combatants: [],
            currentTurn: 0,
            round: 1,
            isActive: false,
            collectingInitiative: true,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp()
          };
          tx.set(ref, data, { merge: true });
          return;
        }
        data = snap.data();
        const updatedCombatants = (data.combatants || []).map(c => {
          if (!c.isPlayer) {
            // Auto-roll initiative for enemies / NPCs
            const roll = Math.floor(Math.random() * 20) + 1; // Simple d20, no modifier yet
            return { ...c, initiative: roll };
          }
          return c; // players will supply their own roll via chat
        });
        tx.update(ref, {
          combatants: updatedCombatants,
          currentTurn: 0,
            round: 1,
            isActive: false,
            collectingInitiative: true,
            lastModified: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error initiating initiative check:', error);
      throw new Error('Failed to begin initiative check');
    }
  },

  /**
   * Record or update a player's initiative roll during collection phase.
   * If the player combatant does not yet exist it will be created.
   * @param {object} character optional character sheet for name/HP & dex modifier
   */
  recordPlayerInitiativeRoll: async (firestore, campaignId, userId, rollTotal, character) => {
    try {
      const ref = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          throw new Error('Initiative tracker not found');
        }
        const data = snap.data();
        let combatants = Array.isArray(data.combatants) ? [...data.combatants] : [];
        const existingIndex = combatants.findIndex(c => c.isPlayer && c.userId === userId);
        if (existingIndex >= 0) {
          combatants[existingIndex] = { ...combatants[existingIndex], initiative: rollTotal };
        } else {
          combatants.push({
            id: `character_${userId}_${Date.now()}`,
            name: character?.name || character?.characterName || 'Player',
            initiative: rollTotal,
            maxHp: character?.maxHp || character?.hp || null,
            hp: character?.hp || character?.maxHp || null,
            type: 'character',
            conditions: [],
            isPlayer: true,
            userId,
            characterId: character?.id || userId,
            addedBy: userId,
            addedAt: new Date()
          });
        }
        tx.update(ref, {
          combatants,
          lastModified: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error recording player initiative roll:', error);
      throw new Error('Failed to record initiative');
    }
  },
  /**
   * Cancel an ongoing initiative collection (does not clear existing combatants or initiatives)
   */
  cancelInitiativeCollection: async (firestore, campaignId) => {
    try {
      const ref = initiativeService.getInitiativeRef(firestore, campaignId);
      await updateDoc(ref, {
        collectingInitiative: false,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error cancelling initiative collection:', error);
      throw new Error('Failed to cancel initiative collection');
    }
  },

  // Add character from campaign to initiative
  addCharacterToInitiative: async (firestore, campaignId, character, userId) => {
    try {
      const initiative = initiativeService.rollInitiativeForCharacter(character);
      
      const combatant = {
        id: `character_${userId}_${Date.now()}`,
        name: character.name || character.characterName || 'Unknown Character',
        initiative,
        maxHp: character.maxHp || character.hp || null,
        hp: character.hp || character.maxHp || null,
        type: 'character',
        conditions: [],
        isPlayer: true,
        userId,
        characterId: character.id,
        addedBy: userId,
        addedAt: new Date()
      };
      
      return await initiativeService.addCombatant(firestore, campaignId, combatant);
    } catch (error) {
      console.error('Error adding character to initiative:', error);
      throw new Error('Failed to add character to initiative');
    }
  },

  // Get combat summary for campaign dashboard
  getCombatSummary: async (firestore, campaignId) => {
    try {
      const initiativeData = await initiativeService.getInitiativeData(firestore, campaignId);
      
      return {
        isActive: initiativeData.isActive,
        round: initiativeData.round,
        combatantsCount: initiativeData.combatants?.length || 0,
        currentTurn: initiativeData.currentTurn,
        currentCombatant: initiativeData.combatants?.[initiativeData.currentTurn] || null
      };
    } catch (error) {
      console.error('Error getting combat summary:', error);
      return {
        isActive: false,
        round: 1,
        combatantsCount: 0,
        currentTurn: 0,
        currentCombatant: null
      };
    }
  },

  // Seed initiative tracker combatants from an active encounter (without auto-starting combat)
  seedFromEncounter: async (firestore, campaignId, encounter) => {
    try {
      if (!encounter || !Array.isArray(encounter.participants)) return;
      const initiativeRef = initiativeService.getInitiativeRef(firestore, campaignId);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(initiativeRef);
        let data;
        if (!snap.exists()) {
          data = {
            combatants: [],
            currentTurn: 0,
            round: 1,
            isActive: false,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp()
          };
          tx.set(initiativeRef, data, { merge: true });
        } else {
          data = snap.data();
        }
        const existing = Array.isArray(data.combatants) ? data.combatants : [];

        const newCombatants = [];
        encounter.participants.forEach(p => {
          const qty = Math.max(1, p.quantity || 1);
          for (let i = 0; i < qty; i++) {
            const baseId = `${encounter.id || encounter.encounterId || 'enc'}_${p.id}_${i}`;
            if (!existing.some(c => c.id === baseId) && !newCombatants.some(c => c.id === baseId)) {
              newCombatants.push({
                id: baseId,
                name: qty > 1 ? `${p.name || 'Creature'} #${i + 1}` : (p.name || 'Creature'),
                initiative: p.initiative || 0,
                maxHp: p.maxHp || p.hp || null,
                hp: p.hp || p.maxHp || null,
                type: p.type || 'enemy',
                sourceEncounterId: encounter.id || encounter.encounterId,
                participantId: p.id,
                conditions: p.conditions || [],
                isPlayer: false,
                addedAt: new Date()
              });
            }
          }
        });

        if (newCombatants.length > 0) {
          tx.set(initiativeRef, {
            ...data,
            combatants: [...existing, ...newCombatants],
            encounterContext: {
              encounterId: encounter.id || encounter.encounterId,
              name: encounter.name || 'Encounter',
              startedAt: encounter.startedAt || new Date()
            },
            lastModified: serverTimestamp()
          }, { merge: true });
        }
      });
    } catch (error) {
      console.error('Error seeding initiative from encounter:', error);
      throw new Error('Failed to seed initiative');
    }
  }
};

export default initiativeService;