import React from 'react';
import { compressImage, uploadImage } from '../services/imageUploadService';
import { createImageMessage } from '../services/messageService';

/**
 * Handles image selection, preview (data URL), compression, upload and message creation.
 */
export function useImageMessage({ storage, firestore, user, getDisplayName, soundEnabled, playSendSound }) {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);

  const handleImageSelect = React.useCallback((file) => {
    if (!file || !file.type?.startsWith('image/')) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const clearImage = React.useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploading(false);
  }, []);

  const sendImageMessage = React.useCallback(async () => {
    if (!selectedImage || uploading || !user) return;
    setUploading(true);
    try {
      const compressed = await compressImage(selectedImage);
      const url = await uploadImage({ storage, file: compressed, uid: user.uid });
      if (!url) throw new Error('Upload failed');
      await createImageMessage({ firestore, imageURL: url, user, getDisplayName });
      clearImage();
      if (soundEnabled && playSendSound) playSendSound();
    } catch (err) {
      console.error('sendImageMessage error', err);
      // TODO: integrate toast system; fallback alert for now
      alert('Failed to upload image: ' + err.message);
      setUploading(false);
    }
  }, [selectedImage, uploading, user, storage, firestore, getDisplayName, soundEnabled, playSendSound, clearImage]);

  return {
    selectedImage,
    imagePreview,
    uploading,
    handleImageSelect,
    clearImage,
    sendImageMessage,
    setSelectedImage,
    setImagePreview,
    setUploading
  };
}
