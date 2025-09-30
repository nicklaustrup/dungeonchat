import React from 'react';
import { compressImage, uploadImage } from '../services/imageUploadService';
import { createImageMessage } from '../services/messageService';
import { useToast } from './useToast';

/**
 * Handles image selection, preview (data URL), compression, upload and message creation.
 */
export function useImageMessage({ storage, firestore, user, getDisplayName, soundEnabled, playSendSound, campaignId = null, channelId = 'general' }) {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const { push: pushToast } = useToast();
  const selectionTokenRef = React.useRef(0);

  const handleImageSelect = React.useCallback((file) => {
    if (!file || !file.type?.startsWith('image/')) return;
    const token = ++selectionTokenRef.current;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      // Ignore stale loads after a cancel/clear
      if (selectionTokenRef.current !== token) return;
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = React.useCallback(() => {
    selectionTokenRef.current++; // invalidate any in-flight readers
    setSelectedImage(null);
    setImagePreview(null);
    setUploading(false);
    setError(null);
    // Double-clear on next tick to guard against any late async callbacks
    setTimeout(() => {
      setSelectedImage(null);
      setImagePreview(null);
    }, 0);
  }, []);

  const sendImageMessage = React.useCallback(async () => {
    if (!selectedImage || uploading || !user) return;
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(selectedImage);
      const url = await uploadImage({ storage, file: compressed, uid: user.uid });
      if (!url) throw new Error('Upload failed');
      await createImageMessage({ 
        firestore, 
        imageURL: url, 
        user, 
        getDisplayName,
        campaignId,
        channelId
      });
      clearImage();
      if (soundEnabled && playSendSound) playSendSound();
    } catch (err) {
      // Comment out console logs to reduce test output noise
      // console.error('sendImageMessage error', err);
      pushToast('Image upload failed: ' + err.message, { type: 'error' });
      setUploading(false);
      setError(err);
    }
  }, [selectedImage, uploading, user, storage, firestore, getDisplayName, soundEnabled, playSendSound, clearImage, pushToast, campaignId, channelId]);

  return {
    selectedImage,
    imagePreview,
    uploading,
  error,
    handleImageSelect,
    clearImage,
    sendImageMessage,
    setSelectedImage,
    setImagePreview,
    setUploading
  };
}
