import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Map Service
 * Handles all map-related operations for the VTT system
 */
export const mapService = {
  /**
   * Create a new map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {Object} mapData - Map data (name, description, imageUrl, width, height, gridSettings)
   * @returns {Promise<Object>} Created map with ID
   */
  async createMap(firestore, campaignId, mapData) {
    const mapId = uuidv4();
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    
    const map = {
      mapId,
      name: mapData.name || 'Untitled Map',
      description: mapData.description || '',
      imageUrl: mapData.imageUrl || '',
      width: mapData.width || 0,
      height: mapData.height || 0,
      gridSize: mapData.gridSize || 50,
      gridColor: mapData.gridColor || '#000000',
      gridOpacity: mapData.gridOpacity || 0.3,
      gridEnabled: mapData.gridEnabled !== undefined ? mapData.gridEnabled : true,
      isActive: false,
      visibility: 'dm',
      createdBy: mapData.createdBy || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(mapRef, map);
    return { ...map, id: mapId };
  },

  /**
   * Get a single map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @returns {Promise<Object>} Map data
   */
  async getMap(firestore, campaignId, mapId) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    const mapSnap = await getDoc(mapRef);
    
    if (!mapSnap.exists()) {
      throw new Error('Map not found');
    }
    
    return { id: mapSnap.id, ...mapSnap.data() };
  },

  /**
   * Get all maps for a campaign
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>} Array of maps
   */
  async getMaps(firestore, campaignId) {
    const mapsRef = collection(firestore, 'campaigns', campaignId, 'maps');
    const q = query(mapsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Update a map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateMap(firestore, campaignId, mapId, updates) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    await updateDoc(mapRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Delete a map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @returns {Promise<void>}
   */
  async deleteMap(firestore, campaignId, mapId) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    await deleteDoc(mapRef);
    // TODO: Delete associated Storage files and tokens
  },

  /**
   * Set a map as active for the campaign
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID to set as active
   * @returns {Promise<void>}
   */
  async setActiveMap(firestore, campaignId, mapId) {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    // First, deactivate all maps
    const maps = await this.getMaps(firestore, campaignId);
    const updatePromises = maps.map(map => {
      if (map.id !== mapId && map.isActive) {
        return this.updateMap(firestore, campaignId, map.id, { isActive: false });
      }
      return Promise.resolve();
    });
    await Promise.all(updatePromises);

    // Then activate the selected map
    await this.updateMap(firestore, campaignId, mapId, { isActive: true });
    
    // Update the campaign's activeMapId so players can see it
    const campaignRef = doc(firestore, 'campaigns', campaignId);
    await updateDoc(campaignRef, { activeMapId: mapId });
  },

  /**
   * Activate a map and return a snapshot of previous active states for undo.
   */
  async activateMapWithSnapshot(firestore, campaignId, mapId) {
    const maps = await this.getMaps(firestore, campaignId);
    const snapshot = maps.map(m => ({ id: m.id, isActive: m.isActive }));
    await this.setActiveMap(firestore, campaignId, mapId);
    return snapshot;
  },

  /**
   * Restore map active states from a snapshot.
   */
  async restoreActiveSnapshot(firestore, campaignId, snapshot) {
    if (!Array.isArray(snapshot)) return;
    await Promise.all(snapshot.map(s => this.updateMap(firestore, campaignId, s.id, { isActive: s.isActive })));
  },

  /**
   * Upload map image to Firebase Storage
   * @param {Object} storage - Firebase Storage instance
   * @param {File} file - Image file
   * @param {string} campaignId - Campaign ID
   * @param {string} userId - User ID
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} { downloadURL, width, height }
   */
  async uploadMapImage(storage, file, campaignId, userId, onProgress) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 20MB');
    }

    const mapId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${mapId}.${fileExtension}`;
    const storageRef = ref(storage, `campaigns/${campaignId}/maps/${fileName}`);

    // Get image dimensions
    const dimensions = await this.getImageDimensions(file);

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadURL,
            width: dimensions.width,
            height: dimensions.height
          });
        }
      );
    });
  },

  /**
   * Get image dimensions from file
   * @param {File} file - Image file
   * @returns {Promise<Object>} { width, height }
   */
  getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  },

  /**
   * Delete map image from Storage
   * @param {Object} storage - Firebase Storage instance
   * @param {string} imageUrl - Full Storage URL
   * @returns {Promise<void>}
   */
  async deleteMapImage(storage, imageUrl) {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting map image:', error);
      // Don't throw - image might already be deleted
    }
  }
};
