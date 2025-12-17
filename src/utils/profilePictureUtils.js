import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/**
 * Upload profile picture to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's UID
 * @param {Object} storage - Firebase Storage instance
 * @returns {Promise<string>} - Download URL of uploaded image
 */
export const uploadProfilePicture = async (file, userId, storage) => {
  if (!file || !userId || !storage) {
    throw new Error("File, userId, and storage are required");
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file");
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("Please select an image smaller than 5MB");
  }

  try {
    // Create a reference to the storage location
    const fileName = `profile-pictures/${userId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw new Error("Failed to upload profile picture: " + error.message);
  }
};

/**
 * Delete profile picture from Firebase Storage
 * @param {string} imageUrl - The URL of the image to delete
 * @param {Object} storage - Firebase Storage instance
 */
export const deleteProfilePicture = async (imageUrl, storage) => {
  if (!imageUrl || !storage) {
    return; // Nothing to delete
  }

  try {
    // Extract the path from the URL if it's a Firebase Storage URL
    if (
      imageUrl.includes("firebase") &&
      imageUrl.includes("profile-pictures")
    ) {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.warn("Could not delete old profile picture:", error);
    // Don't throw error as this is cleanup and shouldn't block profile updates
  }
};

/**
 * Generate a placeholder avatar URL based on user info
 * @param {string} displayName - User's display name or username
 * @param {number} size - Size of the avatar (default: 150)
 * @returns {string} - Placeholder image URL
 */
export const generatePlaceholderAvatar = (displayName = "User", size = 150) => {
  const initial = displayName.charAt(0).toUpperCase();
  return `https://via.placeholder.com/${size}x${size}?text=${encodeURIComponent(initial)}&color=ffffff&background=007bff`;
};

/**
 * Resize image file before upload (optional optimization)
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width (default: 400)
 * @param {number} maxHeight - Maximum height (default: 400)
 * @param {number} quality - JPEG quality (default: 0.8)
 * @returns {Promise<File>} - Resized image file
 */
export const resizeImage = (
  file,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.8
) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          // Create new file from blob
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};
