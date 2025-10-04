/**
 * Boundary Service
 * Manages DM-created boundaries that prevent players from crossing
 * Supports both line boundaries (walls, cliffs) and painted boundaries (out of bounds areas)
 * Players must travel through the map as intended, cannot teleport through walls
 */

import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  Timestamp, 
  getDocs, 
  getDoc,
  updateDoc 
} from 'firebase/firestore';

export const boundaryService = {
  /**
   * Create a boundary line (similar to line tool but persistent and DM-only visible)
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Object} start - Starting point {x, y}
   * @param {Object} end - Ending point {x, y}
   * @param {string} createdBy - User ID of DM who created it
   * @param {boolean} snappedToGrid - Whether the boundary was snapped to grid
   */
  async createBoundary(firestore, campaignId, mapId, start, end, createdBy, snappedToGrid = false) {
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
      visibleTo: 'dm', // Only visible to DMs
      snappedToGrid: snappedToGrid
    };
    
    const docRef = await addDoc(boundariesRef, boundaryData);
    return { id: docRef.id, ...boundaryData };
  },

  /**
   * Create a painted boundary (out of bounds area)
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Array} cells - Array of grid cells {gridX, gridY}
   * @param {string} createdBy - User ID of DM who created it
   */
  async createPaintedBoundary(firestore, campaignId, mapId, cells, createdBy) {
    const boundariesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'boundaries');
    
    const boundaryData = {
      type: 'painted',
      cells: cells,
      createdBy: createdBy,
      createdAt: Timestamp.now(),
      visibleTo: 'dm'
    };
    
    const docRef = await addDoc(boundariesRef, boundaryData);
    return { id: docRef.id, ...boundaryData };
  },

  /**
   * Add cells to an existing painted boundary
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} boundaryId - Boundary document ID
   * @param {Array} newCells - Array of new grid cells to add {gridX, gridY}
   */
  async addPaintedCells(firestore, campaignId, mapId, boundaryId, newCells) {
    const boundaryRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'boundaries', boundaryId);
    const boundaryDoc = await getDoc(boundaryRef);
    
    if (!boundaryDoc.exists() || boundaryDoc.data().type !== 'painted') {
      throw new Error('Invalid painted boundary');
    }
    
    const existingCells = boundaryDoc.data().cells || [];
    
    // Merge new cells, avoiding duplicates
    const cellSet = new Set(existingCells.map(c => `${c.gridX},${c.gridY}`));
    newCells.forEach(cell => cellSet.add(`${cell.gridX},${cell.gridY}`));
    
    const updatedCells = Array.from(cellSet).map(cellStr => {
      const [gridX, gridY] = cellStr.split(',').map(Number);
      return { gridX, gridY };
    });
    
    await updateDoc(boundaryRef, { cells: updatedCells });
    return updatedCells;
  },

  /**
   * Remove cells from an existing painted boundary
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} boundaryId - Boundary document ID
   * @param {Array} cellsToRemove - Array of grid cells to remove {gridX, gridY}
   */
  async removePaintedCells(firestore, campaignId, mapId, boundaryId, cellsToRemove) {
    const boundaryRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'boundaries', boundaryId);
    const boundaryDoc = await getDoc(boundaryRef);
    
    if (!boundaryDoc.exists() || boundaryDoc.data().type !== 'painted') {
      throw new Error('Invalid painted boundary');
    }
    
    const existingCells = boundaryDoc.data().cells || [];
    const removeSet = new Set(cellsToRemove.map(c => `${c.gridX},${c.gridY}`));
    
    const updatedCells = existingCells.filter(cell => 
      !removeSet.has(`${cell.gridX},${cell.gridY}`)
    );
    
    await updateDoc(boundaryRef, { cells: updatedCells });
    return updatedCells;
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
   * Get boundary state (enabled, visible flags) for a map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @returns {Object} - Boundary state { enabled, visible }
   */
  async getBoundaryState(firestore, campaignId, mapId) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    const mapDoc = await getDoc(mapRef);
    
    if (!mapDoc.exists()) {
      return { enabled: false, visible: true };
    }
    
    const data = mapDoc.data();
    return {
      enabled: data.boundariesEnabled ?? false,
      visible: data.boundariesVisible ?? true
    };
  },

  /**
   * Update boundary state (enable/disable, show/hide)
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Object} state - State object { enabled?, visible? }
   */
  async updateBoundaryState(firestore, campaignId, mapId, state) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    const updates = {};
    
    if (state.enabled !== undefined) {
      updates.boundariesEnabled = state.enabled;
    }
    if (state.visible !== undefined) {
      updates.boundariesVisible = state.visible;
    }
    
    await updateDoc(mapRef, updates);
  },

  /**
   * Subscribe to boundary state for a map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Function} callback - Callback function receiving state
   */
  subscribeToBoundaryState(firestore, campaignId, mapId, callback) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    
    return onSnapshot(mapRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback({ enabled: false, visible: true });
        return;
      }
      
      const data = snapshot.data();
      callback({
        enabled: data.boundariesEnabled ?? false,
        visible: data.boundariesVisible ?? true
      });
    });
  },

  /**
   * Check if a move crosses any boundaries
   * Uses line-line intersection algorithm for line boundaries
   * Uses point-in-cell check for painted boundaries
   * @param {Object} from - Starting position {x, y}
   * @param {Object} to - Ending position {x, y}
   * @param {Array} boundaries - Array of boundary objects
   * @param {number} gridSize - Grid size in pixels for painted boundary checks
   * @param {Object} gridOffset - Grid offset {x, y} for painted boundary checks
   * @returns {boolean} - True if move crosses a boundary
   */
  checkBoundaryCrossing(from, to, boundaries, gridSize = 50, gridOffset = { x: 0, y: 0 }) {
    if (!boundaries || boundaries.length === 0) return false;

    // Check each boundary
    for (const boundary of boundaries) {
      if (boundary.type === 'line') {
        // Check line boundary intersection
        if (this.linesIntersect(
          from.x, from.y, to.x, to.y,
          boundary.start.x, boundary.start.y, boundary.end.x, boundary.end.y
        )) {
          return true; // Move crosses this line boundary
        }
      } else if (boundary.type === 'painted') {
        // Check if destination point is in a painted boundary cell
        if (this.checkPointInPaintedBoundary(to, boundary, gridSize, gridOffset)) {
          return true; // Destination is in out of bounds area
        }
      }
    }

    return false; // No boundaries crossed
  },

  /**
   * Check if a point is inside a painted boundary (out of bounds area)
   * @param {Object} point - Point to check {x, y}
   * @param {Object} paintedBoundary - Painted boundary object with cells array
   * @param {number} gridSize - Grid size in pixels
   * @param {Object} gridOffset - Grid offset {x, y}
   * @returns {boolean} - True if point is in the painted boundary
   */
  checkPointInPaintedBoundary(point, paintedBoundary, gridSize, gridOffset = { x: 0, y: 0 }) {
    if (!paintedBoundary || !paintedBoundary.cells || paintedBoundary.type !== 'painted') {
      return false;
    }

    // Calculate which grid cell the point is in
    const gridX = Math.floor((point.x - gridOffset.x) / gridSize);
    const gridY = Math.floor((point.y - gridOffset.y) / gridSize);

    // Check if this grid cell is in the painted boundary
    return paintedBoundary.cells.some(cell => 
      cell.gridX === gridX && cell.gridY === gridY
    );
  },

  /**
   * Check if a grid cell is marked as out of bounds
   * @param {number} gridX - Grid cell X coordinate
   * @param {number} gridY - Grid cell Y coordinate
   * @param {Array} paintedBoundaries - Array of painted boundary objects
   * @returns {boolean} - True if cell is out of bounds
   */
  checkCellInPaintedBoundaries(gridX, gridY, paintedBoundaries) {
    if (!paintedBoundaries || paintedBoundaries.length === 0) return false;

    return paintedBoundaries.some(boundary => {
      if (boundary.type !== 'painted' || !boundary.cells) return false;
      return boundary.cells.some(cell => 
        cell.gridX === gridX && cell.gridY === gridY
      );
    });
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
