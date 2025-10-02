/**
 * Fog of War Service
 * Handles fog of war visibility for maps
 */
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

export const fogOfWarService = {
  /**
   * Initialize fog of war for a map
   */
  async initializeFogOfWar(firestore, campaignId, mapId, gridWidth, gridHeight) {
    try {
      const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
      
      // Create a flattened array (Firestore doesn't support nested arrays)
      // Store as 1D array in row-major order: visibility[y * gridWidth + x]
      const totalCells = gridWidth * gridHeight;
      const visibility = Array(totalCells).fill(false);
      
      await setDoc(fogRef, {
        visibility,
        gridWidth,
        gridHeight,
        enabled: true,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error initializing fog of war:', error);
      throw error;
    }
  },

  /**
   * Get fog of war state
   */
  async getFogOfWar(firestore, campaignId, mapId) {
    try {
      const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
      const fogSnap = await getDoc(fogRef);
      
      if (fogSnap.exists()) {
        const data = fogSnap.data();
        // Reconstruct 2D array from flattened array for easier use
        const { visibility: flat, gridWidth, gridHeight } = data;
        const visibility = [];
        for (let y = 0; y < gridHeight; y++) {
          visibility[y] = [];
          for (let x = 0; x < gridWidth; x++) {
            visibility[y][x] = flat[y * gridWidth + x];
          }
        }
        return { ...data, visibility };
      }
      return null;
    } catch (error) {
      console.error('Error getting fog of war:', error);
      throw error;
    }
  },

  /**
   * Update fog of war visibility and/or enabled state
   */
  async updateFogOfWar(firestore, campaignId, mapId, visibility, enabled) {
    try {
      const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
      
      const updates = {
        updatedAt: new Date().toISOString()
      };
      
      // Update visibility if provided
      if (visibility !== undefined) {
        // Flatten 2D array to 1D for Firestore
        const gridHeight = visibility.length;
        const gridWidth = visibility[0]?.length || 0;
        const flatVisibility = [];
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            flatVisibility.push(visibility[y][x]);
          }
        }
        updates.visibility = flatVisibility;
      }
      
      // Update enabled state if provided
      if (enabled !== undefined) {
        updates.enabled = enabled;
      }
      
      await updateDoc(fogRef, updates);

      return true;
    } catch (error) {
      console.error('Error updating fog of war:', error);
      throw error;
    }
  },

  /**
   * Reveal area around a token (for player movement)
   */
  async revealArea(firestore, campaignId, mapId, centerX, centerY, radius = 2) {
    try {
      const fogData = await this.getFogOfWar(firestore, campaignId, mapId);
      
      if (!fogData || !fogData.enabled) return;

      const { visibility, gridWidth, gridHeight } = fogData;
      const newVisibility = visibility.map(row => [...row]);

      // Reveal circular area
      for (let y = Math.max(0, centerY - radius); y <= Math.min(gridHeight - 1, centerY + radius); y++) {
        for (let x = Math.max(0, centerX - radius); x <= Math.min(gridWidth - 1, centerX + radius); x++) {
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          if (distance <= radius) {
            newVisibility[y][x] = true;
          }
        }
      }

      await this.updateFogOfWar(firestore, campaignId, mapId, newVisibility);
      return true;
    } catch (error) {
      console.error('Error revealing area:', error);
      throw error;
    }
  },

  /**
   * Toggle fog of war on/off
   */
  async toggleFogOfWar(firestore, campaignId, mapId) {
    try {
      const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
      const fogSnap = await getDoc(fogRef);
      
      if (fogSnap.exists()) {
        const currentState = fogSnap.data().enabled;
        await updateDoc(fogRef, {
          enabled: !currentState,
          updatedAt: new Date().toISOString()
        });
        return !currentState;
      }
      
      return false;
    } catch (error) {
      console.error('Error toggling fog of war:', error);
      throw error;
    }
  },

  /**
   * Subscribe to fog of war changes
   */
  subscribeFogOfWar(firestore, campaignId, mapId, callback) {
    try {
      const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
      
      return onSnapshot(fogRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Reconstruct 2D array from flattened array for easier use
          const { visibility: flat, gridWidth, gridHeight } = data;
          const visibility = [];
          for (let y = 0; y < gridHeight; y++) {
            visibility[y] = [];
            for (let x = 0; x < gridWidth; x++) {
              visibility[y][x] = flat[y * gridWidth + x];
            }
          }
          callback({ ...data, visibility });
        } else {
          callback(null);
        }
      });
    } catch (error) {
      console.error('Error subscribing to fog of war:', error);
      throw error;
    }
  },

  /**
   * Clear all fog (reveal entire map)
   */
  async clearAllFog(firestore, campaignId, mapId) {
    try {
      const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
      const fogSnap = await getDoc(fogRef);
      
      if (!fogSnap.exists()) return;

      const { gridWidth, gridHeight } = fogSnap.data();
      const totalCells = gridWidth * gridHeight;
      const visibility = Array(totalCells).fill(true);

      await updateDoc(fogRef, {
        visibility,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error clearing fog:', error);
      throw error;
    }
  },

  /**
   * Alias for clearAllFog
   */
  async clearFogOfWar(firestore, campaignId, mapId) {
    return this.clearAllFog(firestore, campaignId, mapId);
  },

  /**
   * Reset all fog (hide entire map)
   */
  async resetAllFog(firestore, campaignId, mapId) {
    try {
      const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
      const fogSnap = await getDoc(fogRef);
      
      if (!fogSnap.exists()) return;

      const { gridWidth, gridHeight } = fogSnap.data();
      const totalCells = gridWidth * gridHeight;
      const visibility = Array(totalCells).fill(false);

      await updateDoc(fogRef, {
        visibility,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error resetting fog:', error);
      throw error;
    }
  },

  /**
   * Alias for resetAllFog
   */
  async resetFogOfWar(firestore, campaignId, mapId) {
    return this.resetAllFog(firestore, campaignId, mapId);
  }
};

export default fogOfWarService;
