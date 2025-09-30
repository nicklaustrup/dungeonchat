/**
 * Character Sheet Service
 * Handles CRUD operations for character sheets in Firebase
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs
} from 'firebase/firestore';
import { createDefaultCharacterSheet } from '../models/CharacterSheet';

/**
 * Create a new character sheet for a campaign member
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @param {Object} characterData - Character sheet data
 * @returns {Promise<Object>} Created character sheet
 */
export async function createCharacterSheet(firestore, campaignId, userId, characterData) {
  try {
    const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
    
    // Create default character sheet with provided data
    const characterSheet = createDefaultCharacterSheet(
      characterData.name,
      characterData.class,
      characterData.race
    );
    
    // Override with any provided data
    const finalCharacterSheet = {
      ...characterSheet,
      ...characterData,
      userId,
      campaignId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Set current hit points to maximum if not specified
    if (!finalCharacterSheet.currentHitPoints) {
      finalCharacterSheet.currentHitPoints = finalCharacterSheet.hitPointMaximum;
    }
    
    await setDoc(characterRef, finalCharacterSheet);
    
    // Also update the campaign member with character reference
    const memberRef = doc(firestore, 'campaigns', campaignId, 'members', userId);
    await updateDoc(memberRef, {
      hasCharacterSheet: true,
      characterName: characterData.name,
      characterClass: characterData.class,
      characterLevel: finalCharacterSheet.level,
      updatedAt: serverTimestamp()
    });
    
    return { id: userId, ...finalCharacterSheet };
  } catch (error) {
    console.error('Error creating character sheet:', error);
    throw error;
  }
}

/**
 * Get character sheet for a campaign member
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Character sheet or null if not found
 */
export async function getCharacterSheet(firestore, campaignId, userId) {
  try {
    const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
    const characterDoc = await getDoc(characterRef);
    
    if (characterDoc.exists()) {
      return { id: characterDoc.id, ...characterDoc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching character sheet:', error);
    throw error;
  }
}

/**
 * Update character sheet
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @param {Object} updates - Character sheet updates
 * @returns {Promise<Object>} Updated character sheet
 */
export async function updateCharacterSheet(firestore, campaignId, userId, updates) {
  try {
    const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(characterRef, updateData);
    
    // Update campaign member info if basic character data changed
    if (updates.name || updates.class || updates.level) {
      const memberRef = doc(firestore, 'campaigns', campaignId, 'members', userId);
      const memberUpdates = {};
      
      if (updates.name) memberUpdates.characterName = updates.name;
      if (updates.class) memberUpdates.characterClass = updates.class;
      if (updates.level) memberUpdates.characterLevel = updates.level;
      
      if (Object.keys(memberUpdates).length > 0) {
        memberUpdates.updatedAt = serverTimestamp();
        await updateDoc(memberRef, memberUpdates);
      }
    }
    
    // Return updated character sheet
    return await getCharacterSheet(firestore, campaignId, userId);
  } catch (error) {
    console.error('Error updating character sheet:', error);
    throw error;
  }
}

/**
 * Delete character sheet
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteCharacterSheet(firestore, campaignId, userId) {
  try {
    const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
    await deleteDoc(characterRef);
    
    // Update campaign member to remove character reference
    const memberRef = doc(firestore, 'campaigns', campaignId, 'members', userId);
    await updateDoc(memberRef, {
      hasCharacterSheet: false,
      characterName: null,
      characterClass: null,
      characterLevel: null,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting character sheet:', error);
    throw error;
  }
}

/**
 * Get all character sheets for a campaign
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Array>} Array of character sheets
 */
export async function getCampaignCharacters(firestore, campaignId) {
  try {
    const charactersRef = collection(firestore, 'campaigns', campaignId, 'characters');
    const snapshot = await getDocs(charactersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching campaign characters:', error);
    throw error;
  }
}

/**
 * Level up a character (handles XP and level progression)
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @param {number} experienceGained - XP to add
 * @returns {Promise<Object>} Updated character with level changes
 */
export async function addExperience(firestore, campaignId, userId, experienceGained) {
  try {
    const character = await getCharacterSheet(firestore, campaignId, userId);
    if (!character) {
      throw new Error('Character sheet not found');
    }
    
    const newExperience = character.experience + experienceGained;
    const updates = { experience: newExperience };
    
    // Check for level up based on D&D 5e XP table
    const xpThresholds = [
      0,     // Level 1
      300,   // Level 2
      900,   // Level 3
      2700,  // Level 4
      6500,  // Level 5
      14000, // Level 6
      23000, // Level 7
      34000, // Level 8
      48000, // Level 9
      64000, // Level 10
      85000, // Level 11
      100000, // Level 12
      120000, // Level 13
      140000, // Level 14
      165000, // Level 15
      195000, // Level 16
      225000, // Level 17
      265000, // Level 18
      305000, // Level 19
      355000  // Level 20
    ];
    
    let newLevel = character.level;
    for (let level = character.level + 1; level <= 20; level++) {
      if (newExperience >= xpThresholds[level - 1]) {
        newLevel = level;
      } else {
        break;
      }
    }
    
    if (newLevel > character.level) {
      updates.level = newLevel;
      // Recalculate proficiency bonus
      updates.proficiencyBonus = Math.ceil(newLevel / 4) + 1;
      
      // TODO: Add level-up benefits (HP increase, new features, etc.)
    }
    
    return await updateCharacterSheet(firestore, campaignId, userId, updates);
  } catch (error) {
    console.error('Error adding experience:', error);
    throw error;
  }
}

/**
 * Update character hit points
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @param {number} newCurrentHP - New current hit points
 * @param {number} tempHP - Temporary hit points (optional)
 * @returns {Promise<Object>} Updated character
 */
export async function updateHitPoints(firestore, campaignId, userId, newCurrentHP, tempHP = null) {
  try {
    const updates = { currentHitPoints: Math.max(0, newCurrentHP) };
    
    if (tempHP !== null) {
      updates.temporaryHitPoints = Math.max(0, tempHP);
    }
    
    return await updateCharacterSheet(firestore, campaignId, userId, updates);
  } catch (error) {
    console.error('Error updating hit points:', error);
    throw error;
  }
}