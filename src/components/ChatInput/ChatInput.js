import React from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref as databaseRef, set as rtdbSet, serverTimestamp as rtdbServerTimestamp, update as rtdbUpdate } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '../../services/FirebaseContext';
import { playNotificationSound } from '../../utils/sound';
import { getFallbackAvatar } from '../../utils/avatar';

function ChatInput({ getDisplayName, replyingTo, setReplyingTo, soundEnabled, selectedImage, setSelectedImage, imagePreview, setImagePreview, uploading, setUploading }) {
  const { auth, firestore, rtdb, storage } = useFirebase();
  const [formValue, setFormValue] = React.useState('');
  // image + uploading state lifted to parent (ChatPage)

  const messagesRef = collection(firestore, 'messages');

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleImageSelect(file);
  };

  const uploadImage = async (imageFile) => {
    const { uid } = auth.currentUser;
    if (!uid) return null;
    try {
      const compressedImage = await compressImage(imageFile);
      const filename = `${Date.now()}.jpg`;
      const filePath = `images/${uid}/${filename}`;
      const imageStorageRef = storageRef(storage, filePath);
      await uploadBytes(imageStorageRef, compressedImage);
      const downloadURL = await getDownloadURL(imageStorageRef);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error in uploadImage function:', error);
      return null;
    }
  };

  const sendImageMessage = async () => {
    if (!selectedImage || uploading) return;
    setUploading(true);
    try {
      const { uid, photoURL, displayName } = auth.currentUser;
      // Do NOT persist fallback URL, only actual photoURL (or null)
      const imageURL = await uploadImage(selectedImage);
      await addDoc(messagesRef, {
        imageURL,
        createdAt: serverTimestamp(),
        uid,
        photoURL: photoURL || null,
        displayName: getDisplayName ? getDisplayName(uid, displayName) : (displayName || 'Anonymous'),
        reactions: {},
        type: 'image'
      });
      setSelectedImage(null);
      setImagePreview(null);
      if (soundEnabled) playNotificationSound(true);
    } catch (error) {
      console.error('💥 Error in sendImageMessage:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormValue(e.target.value);
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userTypingRef = databaseRef(rtdb, `typing/${uid}`);
      rtdbSet(userTypingRef, {
        typing: e.target.value.length > 0,
        displayName: auth.currentUser.displayName || 'Anonymous',
        timestamp: rtdbServerTimestamp()
      });
      // Refresh presence lastSeen & keep online true
      const presenceRef = databaseRef(rtdb, `presence/${uid}`);
      rtdbUpdate(presenceRef, { online: true, lastSeen: Date.now() });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
  const { uid, photoURL, displayName } = auth.currentUser;
    const userTypingRef = databaseRef(rtdb, `typing/${uid}`);
    rtdbSet(userTypingRef, { typing: false, displayName: displayName || 'Anonymous' });
    // Refresh presence on send
    const presenceRef = databaseRef(rtdb, `presence/${uid}`);
    rtdbUpdate(presenceRef, { online: true, lastSeen: Date.now() }).catch(()=>{});

    const messageData = {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
  photoURL: photoURL || null,
      displayName: getDisplayName ? getDisplayName(uid, displayName) : (displayName || 'Anonymous'),
      reactions: {}
    };
    if (replyingTo && replyingTo.id) {
      const cleanReply = Object.fromEntries(Object.entries(replyingTo).filter(([_, v]) => v !== undefined));
      // Ensure reply type present for Firestore
      if (!cleanReply.type) {
        cleanReply.type = cleanReply.imageURL ? 'image' : (cleanReply.text ? 'text' : 'meta');
      }
      messageData.replyTo = cleanReply;
    }
    try {
      await addDoc(messagesRef, messageData);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
      return;
    }
    setFormValue('');
    setSelectedImage(null);
    setImagePreview(null);
    setUploading(false);
    setReplyingTo(null);
    if (soundEnabled) playNotificationSound(true);
  };

  return (
    <div className="chat-input-area">
      {imagePreview && (
        <div className="image-preview-container">
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <div className="image-preview-actions">
              <button
                onClick={sendImageMessage}
                disabled={uploading}
                className="send-image-btn"
              >
                {uploading ? 'Uploading...' : 'Send Image'}
              </button>
              <button
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="cancel-image-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {replyingTo && (
        <div className="reply-preview">
          <div 
            className="reply-preview-content"
            onClick={() => {
              if (!replyingTo.id) return;
              const selector = `[data-message-id="${replyingTo.id}"]`;
              const targetEl = document.querySelector(selector);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (!targetEl.classList.contains('reply-target')) {
                  targetEl.classList.add('reply-target');
                  setTimeout(() => {
                    targetEl.classList.remove('reply-target');
                  }, 3000);
                }
              }
            }}
            style={{ cursor: replyingTo.id ? 'pointer' : 'default' }}
            title="Jump to original message"
            aria-label="Jump to original message"
          >
            <span className="reply-preview-label">Replying to {replyingTo.displayName}:</span>
            <span className="reply-preview-text">
              {replyingTo.text || (replyingTo.type === 'image' ? '📷 Image' : 'Message')}
            </span>
          </div>
          <button
            className="reply-preview-close"
            onClick={() => setReplyingTo(null)}
            type="button"
            aria-label="Cancel reply"
            title="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}
      <form onSubmit={sendMessage} className="message-form">
        <div className="message-input-wrapper">
          <input
            value={formValue}
            onChange={handleInputChange}
            placeholder="Say something nice"
            className="message-input"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <div className="image-upload-wrapper inside-input">
            <label htmlFor="image-upload" className="image-upload-btn" title="Select image">
              📷
            </label>
            <div className="image-upload-tooltip">
              Drop an image here or click to select
            </div>
          </div>
        </div>
        <button type="submit" disabled={!formValue} className="send-btn" aria-label="Send message">➤</button>
      </form>
    </div>
  );
}

export default ChatInput;
