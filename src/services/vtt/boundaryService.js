/**
 * Boundary Service
 * Manages DM-created boundaries that prevent players from crossing
 * Players must travel through the map as intended, cannot teleport through walls
 */

import { collection, addDoc, deleteDoc, doc, onSnapshot, query, Timestamp, getDocs } from 'firebase/firestore';

export const boundaryService = {
  /**
   * Create a boundary line (similar to line tool but persistent and DM-only visible)
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Object} start - Starting point {x, y}
   * @param {Object} end - Ending point {x, y}
   * @param {string} createdBy - User ID of DM who created it
   */
  async createBoundary(firestore, campaignId, mapId, start, end, createdBy) {
    const boundariesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'boundaries');
    
    const boundaryData = {
      type: 'line',
      start: {
        x: start.x,
        y: start.y
      },
      end: {
        x: end.x,
        y: end.y
      },
      createdBy: createdBy,
      createdAt: Timestamp.now(),
      visibleTo: 'dm' // Only visible to DMs
    };
    
    const docRef = await addDoc(boundariesRef, boundaryData);
    return { id: docRef.id, ...boundaryData };
  },

  /**
   * Delete a boundary
   */
  async deleteBoundary(firestore, campaignId, mapId, boundaryId) {
    const boundaryRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'boundaries', boundaryId);
    await deleteDoc(boundaryRef);
  },

  /**
   * Subscribe to boundaries for a map
   */
  subscribeToBoundaries(firestore, campaignId, mapId, callback) {
    const boundariesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'boundaries');
    const boundariesQuery = query(boundariesRef);

    return onSnapshot(boundariesQuery, (snapshot) => {
      const boundaries = [];
      
      snapshot.forEach((doc) => {
        boundaries.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      callback(boundaries);
    });
  },

  /**
   * Clear all boundaries for a map
   */
  async clearAllBoundaries(firestore, campaignId, mapId) {
    const boundariesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'boundaries');
    const snapshot = await getDocs(boundariesRef);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },

  /**
   * Check if a move crosses any boundaries
   * Uses line-line intersection algorithm
   * @param {Object} from - Starting position {x, y}
   * @param {Object} to - Ending position {x, y}
   * @param {Array} boundaries - Array of boundary objects
   * @returns {boolean} - True if move crosses a boundary
   */
  checkBoundaryCrossing(from, to, boundaries) {
    if (!boundaries || boundaries.length === 0) return false;

    // Check each boundary for intersection with movement line
    for (const boundary of boundaries) {
      if (this.linesIntersect(
        from.x, from.y, to.x, to.y,
        boundary.start.x, boundary.start.y, boundary.end.x, boundary.end.y
      )) {
        return true; // Move crosses this boundary
      }
    }

    return false; // No boundaries crossed
  },

  /**
   * Line-line intersection algorithm
   * Returns true if line segments (p1,p2) and (p3,p4) intersect
   */
  linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Calculate direction of line segments
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    
    // Lines are parallel if denominator is 0
    if (Math.abs(denom) < 0.0001) return false;
    
    // Calculate intersection parameters
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    // Lines intersect if both parameters are between 0 and 1
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }
};
