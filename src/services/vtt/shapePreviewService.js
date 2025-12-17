/**
 * Shape Preview Service
 * Real-time collaborative shape preview system
 * Shows other users' shape placement attempts before they commit
 */

import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export const shapePreviewService = {
  /**
   * Update user's shape preview for others to see
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} userId - User ID
   * @param {string} username - Username to display
   * @param {Object|null} preview - Shape preview data or null to clear
   */
  async updateShapePreview(
    firestore,
    campaignId,
    mapId,
    userId,
    username,
    preview
  ) {
    const previewRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "maps",
      mapId,
      "shapePreviews",
      userId
    );

    if (!preview) {
      // Clear preview
      try {
        await deleteDoc(previewRef);
      } catch (error) {
        // Document may not exist, that's fine
        console.debug("Preview already cleared:", error);
      }
      return;
    }

    const previewData = {
      userId,
      username,
      shapeType: preview.type,
      geometry: preview.geometry,
      color: preview.color || "#ffff00",
      opacity: preview.opacity || 0.3,
      updatedAt: serverTimestamp(),
      expiresAt: Date.now() + 30000, // 30 seconds TTL
    };

    await setDoc(previewRef, previewData);
  },

  /**
   * Subscribe to shape previews from other users
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} currentUserId - Current user's ID (to filter out own previews)
   * @param {Function} callback - Callback with array of previews
   * @returns {Function} Unsubscribe function
   */
  subscribeToShapePreviews(
    firestore,
    campaignId,
    mapId,
    currentUserId,
    callback
  ) {
    if (!firestore || !campaignId || !mapId) {
      return () => {};
    }

    const previewsRef = collection(
      firestore,
      "campaigns",
      campaignId,
      "maps",
      mapId,
      "shapePreviews"
    );

    return onSnapshot(previewsRef, (snapshot) => {
      const now = Date.now();
      const previews = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Filter out own preview and expired previews
        if (data.userId !== currentUserId && data.expiresAt > now) {
          previews.push({
            id: doc.id,
            ...data,
          });
        }
      });

      callback(previews);
    });
  },

  /**
   * Clear user's preview (call on unmount or tool change)
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} userId - User ID
   */
  async clearPreview(firestore, campaignId, mapId, userId) {
    await this.updateShapePreview(
      firestore,
      campaignId,
      mapId,
      userId,
      "",
      null
    );
  },
};
