/**
 * Cursor Service
 * Manages real-time cursor positions for all users on the VTT map
 * Allows players and DMs to see where others are pointing
 */

import { doc, setDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';

export const cursorService = {
  /**
   * Update user's cursor position on the map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} userId - User ID
   * @param {string} username - User display name
   * @param {Object} position - Cursor position {x, y}
   * @param {string} color - User's cursor color (unique per user)
   */
  async updateCursorPosition(firestore, campaignId, mapId, userId, username, position, color) {
    const cursorRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'cursors', userId);
    
    await setDoc(cursorRef, {
      userId,
      username,
      position: {
        x: position.x,
        y: position.y
      },
      color: color || this.generateUserColor(userId),
      lastUpdate: Date.now()
    });
  },

  /**
   * Remove user's cursor from the map (when they leave or stop moving)
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} userId - User ID
   */
  async removeCursor(firestore, campaignId, mapId, userId) {
    const cursorRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'cursors', userId);
    await deleteDoc(cursorRef);
  },

  /**
   * Subscribe to all cursor positions for a map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Function} callback - Callback function receiving cursor array
   * @returns {Function} - Unsubscribe function
   */
  subscribeToCursors(firestore, campaignId, mapId, callback) {
    const cursorsRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'cursors');
    
    return onSnapshot(cursorsRef, (snapshot) => {
      const cursors = [];
      const now = Date.now();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter out stale cursors (not updated in last 5 seconds)
        if (now - data.lastUpdate < 5000) {
          cursors.push({
            id: doc.id,
            ...data
          });
        } else {
          // Auto-cleanup stale cursor
          deleteDoc(doc.ref).catch(err => console.error('Error deleting stale cursor:', err));
        }
      });
      
      callback(cursors);
    });
  },

  /**
   * Generate a consistent color for a user based on their ID
   * @param {string} userId - User ID
   * @returns {string} - Hex color
   */
  generateUserColor(userId) {
    // Hash user ID to generate consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate bright, saturated colors (avoid dark colors)
    const hue = Math.abs(hash % 360);
    const saturation = 70 + (Math.abs(hash >> 8) % 30); // 70-100%
    const lightness = 50 + (Math.abs(hash >> 16) % 20); // 50-70%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
};
