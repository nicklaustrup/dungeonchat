import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

/**
 * Drawing Service
 * Handles temporary pen marks and arrows on the map
 * Pen strokes fade after 10 seconds, arrows after 30 seconds
 */
export const drawingService = {
  /**
   * Create a pen stroke
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Array} points - Array of {x, y} points
   * @param {string} color - Stroke color
   * @param {string} userId - User ID
   * @param {string} username - User display name for attribution
   */
  async createPenStroke(
    firestore,
    campaignId,
    mapId,
    points,
    color = "#ffffff",
    userId,
    username = ""
  ) {
    const strokeId = uuidv4();
    const strokeRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "vtt",
      mapId,
      "drawings",
      strokeId
    );

    const stroke = {
      id: strokeId,
      type: "pen",
      points,
      color,
      createdBy: userId,
      createdByName: username,
      createdAt: serverTimestamp(),
    };

    await setDoc(strokeRef, stroke);

    // Auto-delete after 3 seconds
    setTimeout(async () => {
      try {
        await deleteDoc(strokeRef);
      } catch (err) {
        console.error("Error auto-deleting pen stroke:", err);
      }
    }, 3000);

    return stroke;
  },

  /**
   * Create an arrow
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Object} start - Starting point {x, y}
   * @param {Object} end - Ending point {x, y}
   * @param {string} color - Arrow color
   * @param {string} userId - User ID
   * @param {string} username - User display name for attribution
   */
  async createArrow(
    firestore,
    campaignId,
    mapId,
    start,
    end,
    color = "#ffff00",
    userId,
    username = ""
  ) {
    const arrowId = uuidv4();
    const arrowRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "vtt",
      mapId,
      "drawings",
      arrowId
    );

    const arrow = {
      id: arrowId,
      type: "arrow",
      start,
      end,
      color,
      createdBy: userId,
      createdByName: username,
      createdAt: serverTimestamp(),
    };

    await setDoc(arrowRef, arrow);

    // Auto-delete after 3 seconds
    setTimeout(async () => {
      try {
        await deleteDoc(arrowRef);
      } catch (err) {
        console.error("Error auto-deleting arrow:", err);
      }
    }, 3000);

    return arrow;
  },

  /**
   * Subscribe to drawings
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Function} callback - Callback function
   */
  subscribeToDrawings(firestore, campaignId, mapId, callback) {
    const drawingsRef = collection(
      firestore,
      "campaigns",
      campaignId,
      "vtt",
      mapId,
      "drawings"
    );

    return onSnapshot(
      drawingsRef,
      (snapshot) => {
        const drawings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(drawings);
      },
      (error) => {
        console.error("Error subscribing to drawings:", error);
        callback([]);
      }
    );
  },

  /**
   * Delete a drawing manually
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} drawingId - Drawing ID
   */
  async deleteDrawing(firestore, campaignId, mapId, drawingId) {
    const drawingRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "vtt",
      mapId,
      "drawings",
      drawingId
    );
    await deleteDoc(drawingRef);
  },
};
