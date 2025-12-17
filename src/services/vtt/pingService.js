/**
 * Ping Service
 * Handles map ping markers for player communication
 */
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";

const PING_DURATION = 3000; // 3 seconds

export const pingService = {
  /**
   * Create a ping marker on the map
   */
  async createPing(firestore, campaignId, mapId, pingData) {
    try {
      const pingsRef = collection(
        firestore,
        "campaigns",
        campaignId,
        "vtt",
        mapId,
        "pings"
      );

      const ping = {
        ...pingData,
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + PING_DURATION,
      };

      const docRef = await addDoc(pingsRef, ping);

      // Auto-delete after duration
      setTimeout(async () => {
        try {
          await deleteDoc(
            doc(
              firestore,
              "campaigns",
              campaignId,
              "vtt",
              mapId,
              "pings",
              docRef.id
            )
          );
        } catch (err) {
          console.error("Error auto-deleting ping:", err);
        }
      }, PING_DURATION);

      return docRef.id;
    } catch (error) {
      console.error("Error creating ping:", error);
      throw error;
    }
  },

  /**
   * Subscribe to pings for a map
   */
  subscribeToPings(firestore, campaignId, mapId, callback) {
    try {
      const pingsRef = collection(
        firestore,
        "campaigns",
        campaignId,
        "vtt",
        mapId,
        "pings"
      );
      const q = query(pingsRef);

      return onSnapshot(q, (snapshot) => {
        const pings = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only include non-expired pings
          if (!data.expiresAt || data.expiresAt > Date.now()) {
            pings.push({
              id: doc.id,
              ...data,
            });
          }
        });
        callback(pings);
      });
    } catch (error) {
      console.error("Error subscribing to pings:", error);
      throw error;
    }
  },

  /**
   * Delete a ping manually
   */
  async deletePing(firestore, campaignId, mapId, pingId) {
    try {
      await deleteDoc(
        doc(firestore, "campaigns", campaignId, "vtt", mapId, "pings", pingId)
      );
    } catch (error) {
      console.error("Error deleting ping:", error);
      throw error;
    }
  },
};

export default pingService;
