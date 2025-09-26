// Image upload & compression service
// Handles client-side compression and Firebase Storage upload.
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Compress an image file to a JPEG Blob with smart heuristics to preserve visual quality.
 * Goals:
 *  - Avoid over-compressing small images
 *  - Preserve GIF animation (skip canvas path for GIFs)
 *  - Keep large images reasonably sized for network (default 1600px largest edge)
 *  - Use higher quality (0.9) than previous implementation (0.8) to prevent artifacts
 *
 * @param {File} file
 * @param {Object} options
 * @param {number} options.maxWidth - Max width OR height (largest edge) constraint.
 * @param {number} options.maxHeight - Optional separate max height (defaults to maxWidth).
 * @param {number} options.quality - JPEG quality 0..1
 * @returns {Promise<Blob|File>} compressed blob or original file (if skipped)
 */
export function compressImage(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.9 } = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Heuristic: skip compression for very small files (< 1MB) or already small dimensions.
      if (file.size < 1_000_000 || /image\/gif/i.test(file.type)) {
        // Return original to preserve animation / avoid needless quality loss.
        return resolve(file);
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob) resolve(blob); else resolve(file); // fallback to original file if blob null
          }, 'image/jpeg', quality);
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          console.error('compressImage processing error', err);
          resolve(file); // fallback silently
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file); // fallback silently
      };
      img.src = objectUrl;
    } catch (outer) {
      console.error('compressImage setup error', outer);
      resolve(file);
    }
  });
}

/**
 * Upload an image blob/file to Firebase Storage and return the download URL.
 * @param {Object} params
 * @param {import('firebase/storage').FirebaseStorage} params.storage
 * @param {File|Blob} params.file
 * @param {string} params.uid
 * @returns {Promise<string|null>} download URL or null on failure
 */
export async function uploadImage({ storage, file, uid }) {
  if (!uid) return null;
  try {
    const filename = `${Date.now()}.jpg`;
    const filePath = `images/${uid}/${filename}`;
    const imageStorageRef = storageRef(storage, filePath);
    await uploadBytes(imageStorageRef, file);
    const downloadURL = await getDownloadURL(imageStorageRef);
    return downloadURL;
  } catch (error) {
    console.error('uploadImage error:', error);
    return null;
  }
}
