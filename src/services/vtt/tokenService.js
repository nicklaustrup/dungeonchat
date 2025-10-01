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
  orderBy,
  where
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Token Service
 * Handles all token-related operations for the VTT system
 */
export const tokenService = {
  /**
   * Create a new token
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {Object} tokenData - Token data
   * @returns {Promise<Object>} Created token with ID
   */
  async createToken(firestore, campaignId, mapId, tokenData) {
    const tokenId = uuidv4();
    const tokenRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens', tokenId);
    
    const token = {
      tokenId,
      name: tokenData.name || 'Unnamed Token',
      type: tokenData.type || 'enemy', // 'player' | 'enemy' | 'npc' | 'object'
      imageUrl: tokenData.imageUrl || '',
      position: tokenData.position || { x: 0, y: 0 },
      size: tokenData.size || { width: 50, height: 50 },
      rotation: tokenData.rotation || 0,
      color: tokenData.color || '#ff0000',
      characterId: tokenData.characterId || null,
      ownerId: tokenData.ownerId || null,
      isHidden: tokenData.isHidden || false,
      staged: tokenData.staged || false,
      createdBy: tokenData.createdBy || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(tokenRef, token);
    return { ...token, id: tokenId };
  },

  /**
   * Get a single token
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} tokenId - Token ID
   * @returns {Promise<Object>} Token data
   */
  async getToken(firestore, campaignId, mapId, tokenId) {
    const tokenRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens', tokenId);
    const tokenSnap = await getDoc(tokenRef);
    
    if (!tokenSnap.exists()) {
      throw new Error('Token not found');
    }
    
    return { id: tokenSnap.id, ...tokenSnap.data() };
  },

  /**
   * Get all tokens for a map
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @returns {Promise<Array>} Array of tokens
   */
  async getTokens(firestore, campaignId, mapId) {
    const tokensRef = collection(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens');
    const q = query(tokensRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Update a token
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} tokenId - Token ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateToken(firestore, campaignId, mapId, tokenId, updates) {
    const tokenRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens', tokenId);
    await updateDoc(tokenRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Update token position
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} tokenId - Token ID
   * @param {Object} position - {x, y}
   * @returns {Promise<void>}
   */
  async updateTokenPosition(firestore, campaignId, mapId, tokenId, position) {
    await this.updateToken(firestore, campaignId, mapId, tokenId, {
      position,
      lastMovedAt: serverTimestamp()
    });
  },

  /**
   * Delete a token
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} tokenId - Token ID
   * @returns {Promise<void>}
   */
  async deleteToken(firestore, campaignId, mapId, tokenId) {
    const tokenRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens', tokenId);
    await deleteDoc(tokenRef);
  },

  /**
   * Upload token image to Firebase Storage
   * @param {Object} storage - Firebase Storage instance
   * @param {File} file - Image file
   * @param {string} campaignId - Campaign ID
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<string>} Download URL
   */
  async uploadTokenImage(storage, file, campaignId, onProgress) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB for tokens)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Token image must be less than 5MB');
    }

    const tokenId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${tokenId}.${fileExtension}`;
    const storageRef = ref(storage, `campaigns/${campaignId}/tokens/${fileName}`);

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
          resolve(downloadURL);
        }
      );
    });
  },

  /**
   * Delete token image from Storage
   * @param {Object} storage - Firebase Storage instance
   * @param {string} imageUrl - Full Storage URL
   * @returns {Promise<void>}
   */
  async deleteTokenImage(storage, imageUrl) {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting token image:', error);
      // Don't throw - image might already be deleted
    }
  },

  /**
   * Get tokens by type
   * @param {Object} firestore - Firestore instance
   * @param {string} campaignId - Campaign ID
   * @param {string} mapId - Map ID
   * @param {string} type - Token type ('player', 'enemy', 'npc', 'object')
   * @returns {Promise<Array>} Array of tokens
   */
  async getTokensByType(firestore, campaignId, mapId, type) {
    const tokensRef = collection(firestore, 'campaigns', campaignId, 'mapTokens', mapId, 'tokens');
    const q = query(tokensRef, where('type', '==', type), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
