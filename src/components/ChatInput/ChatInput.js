import React from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref as databaseRef, set as rtdbSet, serverTimestamp as rtdbServerTimestamp, update as rtdbUpdate } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '../../services/FirebaseContext';
import './ChatInput.css';
import { playNotificationSound, playTypingSound } from '../../utils/sound';
import { FaPlus } from 'react-icons/fa6';
import { VscSmiley } from 'react-icons/vsc';
import EmojiMenu from './EmojiMenu';

function ChatInput({ getDisplayName, replyingTo, setReplyingTo, soundEnabled, selectedImage, setSelectedImage, imagePreview, setImagePreview, uploading, setUploading, forceScrollBottom }) {
  const { auth, firestore, rtdb, storage } = useFirebase();
  const [formValue, setFormValue] = React.useState('');
  const inputRef = React.useRef(null); // textarea (fixed height)
  const emojiBtnRef = React.useRef(null);
  const [emojiOpen, setEmojiOpen] = React.useState(false);
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

  // Removed auto-resize logic; fixed-height textarea with scroll.

  const handleInputChange = (e) => {
    const val = e.target.value;
    setFormValue(val);
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
    // Play a subtle self typing tap only when transitioning from empty -> has content
    if (soundEnabled && formValue.length === 0 && e.target.value.length === 1) {
  playTypingSound(true, { self: true, withReverb: true });
  ChatInput._lastSelfTap = Date.now();
    } else if (soundEnabled && e.target.value.length > 1) {
      // Throttle further self taps every ~6 seconds to avoid annoyance
      const now = Date.now();
      if (!ChatInput._lastSelfTap || now - ChatInput._lastSelfTap > 6000) {
        playTypingSound(true, { self: true, withReverb: true });
        ChatInput._lastSelfTap = now;
      }
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
  // message sent
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
    if (soundEnabled) { playNotificationSound(true); }
    if (forceScrollBottom) { setTimeout(() => forceScrollBottom(), 10); }
  };

  React.useEffect(() => {
    const prefillHandler = (e) => {
      if (!e.detail || !e.detail.text) return;
      setFormValue(e.detail.text);
      if (inputRef.current) {
        inputRef.current.focus();
        // Move caret to end
        const val = e.detail.text;
        requestAnimationFrame(() => {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = val.length;
        });
      }
    };
    document.addEventListener('chat:prefill', prefillHandler);
    return () => document.removeEventListener('chat:prefill', prefillHandler);
  }, []);

  // Keyboard shortcut: Ctrl+I (or Cmd+I on Mac) to open image file dialog
  React.useEffect(() => {
    const handleShortcut = (e) => {
      // Ignore if focused element is an input/textarea to avoid interfering with native shortcuts
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      const isMod = e.ctrlKey || e.metaKey; // support Cmd on macOS
      if (isMod && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
          fileInput.click();
        }
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  // Adjust height on mount & when reply cleared
  // Removed height adjustment effects.

  const handleEmojiPick = (emojiData) => {
    const emoji = emojiData?.emoji || '';
    if (!emoji) return;
    setFormValue(v => v + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleEmojiMenu = () => {
    if (emojiOpen) {
      // Let outside click handler in EmojiMenu close it; just flag state
      setEmojiOpen(false);
      return;
    }
    const anchorRect = emojiBtnRef.current ? emojiBtnRef.current.getBoundingClientRect() : null;
    EmojiMenu.open({
      anchorRect,
      onSelect: handleEmojiPick,
      onClose: () => setEmojiOpen(false)
    });
    setEmojiOpen(true);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (formValue.trim()) {
        sendMessage(e);
        // No height reset needed; fixed height.
      }
    }
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
        <div className="reply-preview compact">
          <button
            type="button"
            className="reply-preview-label only"
            onClick={() => {
              if (!replyingTo.id) return;
              const selector = `[data-message-id="${replyingTo.id}"]`;
              const targetEl = document.querySelector(selector);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (!targetEl.classList.contains('reply-target')) {
                  targetEl.classList.add('reply-target');
                  setTimeout(()=> targetEl.classList.remove('reply-target'), 3000);
                }
              }
            }}
            aria-label={`Jump to original message from ${replyingTo.displayName}`}
            title={`Jump to original message from ${replyingTo.displayName}`}
          >
            Replying to {replyingTo.displayName}
          </button>
          <button
            className="reply-preview-close tiny"
            onClick={() => setReplyingTo(null)}
            type="button"
            aria-label="Cancel reply"
            title="Cancel reply"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      )}
      <form onSubmit={sendMessage} className="message-form">
        <div className="message-bar" role="group" aria-label="Message input">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <button
            type="button"
            className="bar-icon-btn"
            aria-label="Upload image"
            data-tip="Upload image"
            onClick={() => {
              const fileInput = document.getElementById('image-upload');
              if (fileInput) fileInput.click();
            }}
          >
            <FaPlus size={18} aria-hidden="true" />
          </button>
          <textarea
            ref={inputRef}
            value={formValue}
            onChange={handleInputChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Send a message"
            className="message-input"
            aria-label="Message text"
            rows={1}
            spellCheck={true}
          />
          <button
            type="button"
            ref={emojiBtnRef}
            className={`bar-icon-btn ${emojiOpen ? 'emoji-active' : ''}`}
            aria-label="Add emoji"
            data-tip="Add emoji"
            onClick={toggleEmojiMenu}
          >
            <VscSmiley size={20} aria-hidden="true" />
          </button>
        </div>
        <button type="submit" disabled={!formValue} className="send-btn" aria-label="Send message">➤</button>
      </form>
    </div>
  );
}

export default ChatInput;
