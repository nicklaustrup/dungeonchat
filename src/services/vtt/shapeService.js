/**
 * Shape Service
 * Manages shape drawings (      color: color || '#ffff00',
      opacity: opacity || 0.8,
      persistent: persistent || false,
      visibleTo: visibleTo || 'all',
      createdBy: createdBy,
      createdByName: createdByName,
      createdAt: Timestamp.now(),
      expiresAt: persistent ? null : Timestamp.fromMillis(Date.now() + 13000), rectangles, cones, lines) on maps
 * Supports persistent and temporary shapes with customizable colors and opacity
 */

import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, Timestamp, getDocs, setDoc } from 'firebase/firestore';

export const shapeService = {
  /**
   * Create a circle shape
   */
  async createCircle(firestore, campaignId, mapId, center, radius, color, opacity, persistent, visibleTo, createdBy, createdByName = '') {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    
    const shapeData = {
      type: 'circle',
      geometry: {
        x: center.x,
        y: center.y,
        radius: radius
      },
      color: color || '#ff0000',
      opacity: opacity || 0.5,
      persistent: persistent || false,
      visibleTo: visibleTo || 'all', // 'dm' or 'all'
      createdBy: createdBy,
      createdByName: createdByName,
      createdAt: Timestamp.now(),
      expiresAt: persistent ? null : Timestamp.fromMillis(Date.now() + 13000) // 13 seconds for temporary (3s visible + 10s fade)
    };
    
    const docRef = await addDoc(shapesRef, shapeData);
    return { id: docRef.id, ...shapeData };
  },

  /**
   * Create a rectangle shape
   */
  async createRectangle(firestore, campaignId, mapId, topLeft, width, height, color, opacity, persistent, visibleTo, createdBy, createdByName = '') {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    
    const shapeData = {
      type: 'rectangle',
      geometry: {
        x: topLeft.x,
        y: topLeft.y,
        width: width,
        height: height
      },
      color: color || '#00ff00',
      opacity: opacity || 0.5,
      persistent: persistent || false,
      visibleTo: visibleTo || 'all',
      createdBy: createdBy,
      createdByName: createdByName,
      createdAt: Timestamp.now(),
      expiresAt: persistent ? null : Timestamp.fromMillis(Date.now() + 13000)
    };
    
    const docRef = await addDoc(shapesRef, shapeData);
    return { id: docRef.id, ...shapeData };
  },

  /**
   * Create a cone/triangle shape
   */
  async createCone(firestore, campaignId, mapId, origin, direction, length, angle, color, opacity, persistent, visibleTo, createdBy, createdByName = '') {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    
    const shapeData = {
      type: 'cone',
      geometry: {
        x: origin.x,
        y: origin.y,
        direction: direction, // in degrees
        length: length,
        angle: angle || 60 // cone angle in degrees
      },
      color: color || '#0000ff',
      opacity: opacity || 0.5,
      persistent: persistent || false,
      visibleTo: visibleTo || 'all',
      createdBy: createdBy,
      createdByName: createdByName,
      createdAt: Timestamp.now(),
      expiresAt: persistent ? null : Timestamp.fromMillis(Date.now() + 13000)
    };
    
    const docRef = await addDoc(shapesRef, shapeData);
    return { id: docRef.id, ...shapeData };
  },

  /**
   * Create a line shape
   */
  async createLine(firestore, campaignId, mapId, start, end, color, opacity, persistent, visibleTo, createdBy, createdByName = '') {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    
    const shapeData = {
      type: 'line',
      geometry: {
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y
      },
      color: color || '#ffff00',
      opacity: opacity || 0.8,
      persistent: persistent || false,
      visibleTo: visibleTo || 'all',
      createdBy: createdBy,
      createdByName: createdByName,
      createdAt: Timestamp.now(),
      expiresAt: persistent ? null : Timestamp.fromMillis(Date.now() + 13000)
    };
    
    const docRef = await addDoc(shapesRef, shapeData);
    return { id: docRef.id, ...shapeData };
  },

  /**
   * Delete a shape
   */
  async deleteShape(firestore, campaignId, mapId, shapeId) {
    const shapeRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes', shapeId);
    await deleteDoc(shapeRef);
  },

  /**
   * Subscribe to shapes for a map (with automatic cleanup of expired temporary shapes)
   */
  subscribeToShapes(firestore, campaignId, mapId, callback) {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    const shapesQuery = query(shapesRef);

    return onSnapshot(shapesQuery, (snapshot) => {
      const shapes = [];
      const now = Date.now();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter out expired temporary shapes
        if (data.expiresAt && data.expiresAt.toMillis() < now) {
          // Auto-delete expired shape
          deleteDoc(doc.ref).catch(err => console.error('Error deleting expired shape:', err));
        } else {
          shapes.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      callback(shapes);
    });
  },

  /**
   * Clear all temporary shapes
   */
  async clearTemporaryShapes(firestore, campaignId, mapId) {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    const tempShapesQuery = query(shapesRef, where('persistent', '==', false));
    
    const snapshot = await getDocs(tempShapesQuery);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },

  /**
   * Clear all shapes (including persistent)
   */
  async clearAllShapes(firestore, campaignId, mapId) {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    const snapshot = await getDocs(shapesRef);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },

  /**
   * Restore an array of shapes (used for undo). Shape objects should include original id and fields.
   */
  async restoreShapes(firestore, campaignId, mapId, shapes) {
    if (!Array.isArray(shapes) || !shapes.length) return;
    const tasks = shapes.map(s => {
      const ref = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes', s.id);
      // Persist original timestamps if present; otherwise set new createdAt.
      const { id, ...rest } = s;
      return setDoc(ref, {
        ...rest,
        createdAt: rest.createdAt || Timestamp.now(),
        expiresAt: rest.expiresAt || (rest.persistent ? null : (rest.expiresAt ?? Timestamp.fromMillis(Date.now() + 10000)))
      });
    });
    await Promise.all(tasks);
  },

  /**
   * Clear shapes created by a specific user
   */
  async clearUserShapes(firestore, campaignId, mapId, userId) {
    const shapesRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'shapes');
    const userShapesQuery = query(shapesRef, where('createdBy', '==', userId));
    
    const snapshot = await getDocs(userShapesQuery);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
};
