import React from 'react';
import './ChatInput.css';
import { useFirebase } from '../../services/FirebaseContext';
import { playSendMessageSound } from '../../utils/sound';
import { createTextMessage } from '../../services/messageService';
import { useChatReply, useChatImage, useBulkImages } from '../../contexts/ChatStateContext';
import { useImageMessage } from '../../hooks/useImageMessage';
import { useTypingPresence } from '../../hooks/useTypingPresence';
import { useEmojiPicker } from '../../hooks/useEmojiPicker';
import { useToast } from '../../hooks/useToast';
import { ReplyPreview } from './ReplyPreview';
import { ImagePreviewModal } from './ImagePreviewModal';
import { BulkImagePreviewModal } from './BulkImagePreviewModal';
import { MessageBar } from './MessageBar';

function ChatInput({
  getDisplayName,
  soundEnabled,
  forceScrollBottom,
  campaignId = null,
  channelId = 'general'
}) {
  const { auth, firestore, rtdb, storage } = useFirebase();
  const user = auth.currentUser;
  const [text, setText] = React.useState('');

  // Use centralized state instead of prop drilling  
  const { replyingTo, setReplyingTo } = useChatReply();
  const { selectedFile: contextSelectedFile, preview: contextPreview, uploading: contextUploading, clearImage, setUploading } = useChatImage();
  const { images: bulkImages, uploading: bulkUploading, removeImage, clearAllImages, setImagesUploading, addImages } = useBulkImages();
  const { push: pushToast } = useToast();

  // Image handling - hybrid approach to support both drag-drop (context) and file picker (hook)
  const imageHook = useImageMessage({
    storage,
    firestore,
    user,
    getDisplayName,
    soundEnabled,
    playSendSound: () => playSendMessageSound(true),
    campaignId,
    channelId
  });

  // Merge context and hook state for image preview
  const hasContextImage = contextSelectedFile && contextPreview;
  
  const activeImagePreview = hasContextImage ? contextPreview : imageHook.imagePreview;
  const activeImageFile = hasContextImage ? contextSelectedFile : imageHook.selectedImage;
  const isUploading = hasContextImage ? contextUploading : imageHook.uploading;

  const handleLocalFile = React.useCallback((file) => {
    imageHook.handleImageSelect(file);
  }, [imageHook]);

  const handleLocalFiles = React.useCallback((files) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(file => file.type && file.type.startsWith('image/'));
    
    if (imageFiles.length === 1) {
      // Single image - use existing flow
      handleLocalFile(imageFiles[0]);
    } else if (imageFiles.length > 1) {
      // Multiple images - use bulk flow
      addImages(imageFiles);
    }
  }, [handleLocalFile, addImages]);
  
  const handleClearImage = React.useCallback(() => {
    if (hasContextImage) {
      clearImage(); // Clear context state
    } else {
      imageHook.clearImage(); // Clear hook state
    }
  }, [hasContextImage, imageHook, clearImage]);

  const handleClearBulkImages = React.useCallback(() => {
    clearAllImages();
  }, [clearAllImages]);

  const handleSendImage = React.useCallback(async () => {
    if (hasContextImage) {
      // Handle context image upload
      if (!activeImageFile || isUploading || !user) return;
      setUploading(true);
      try {
        // Use the same upload logic as imageHook
        const { compressImage, uploadImage } = await import('../../services/imageUploadService');
        const { createImageMessage } = await import('../../services/messageService');
        
        const compressed = await compressImage(activeImageFile);
        const url = await uploadImage({ storage, file: compressed, uid: user.uid });
        if (!url) throw new Error('Upload failed');
        await createImageMessage({ firestore, imageURL: url, user, getDisplayName });
        clearImage();
        if (soundEnabled) playSendMessageSound(true);
      } catch (err) {
        console.error('Context image upload error:', err);
        pushToast('Image upload failed: ' + err.message, { type: 'error' });
        setUploading(false);
      }
    } else {
      // Use hook's send method
      await imageHook.sendImageMessage();
    }
  }, [hasContextImage, activeImageFile, isUploading, user, setUploading, storage, firestore, getDisplayName, soundEnabled, clearImage, imageHook, pushToast]);

  const handleSendBulkImages = React.useCallback(async () => {
    if (!bulkImages || bulkImages.length === 0 || bulkUploading || !user) return;
    
    setImagesUploading(true);
    try {
      const { compressImage, uploadImage } = await import('../../services/imageUploadService');
      const { createImageMessage } = await import('../../services/messageService');
      
      // Upload all images in parallel
      const uploadPromises = bulkImages.map(async (imageObj) => {
        const compressed = await compressImage(imageObj.file);
        const url = await uploadImage({ storage, file: compressed, uid: user.uid });
        if (!url) throw new Error('Upload failed for ' + imageObj.file.name);
        return createImageMessage({ firestore, imageURL: url, user, getDisplayName });
      });
      
      await Promise.all(uploadPromises);
      clearAllImages();
      if (soundEnabled) playSendMessageSound(true);
      if (forceScrollBottom) setTimeout(() => forceScrollBottom(), 10);
    } catch (err) {
      console.error('Bulk image upload error:', err);
      pushToast('Some images failed to upload: ' + err.message, { type: 'error' });
      setImagesUploading(false);
    }
  }, [bulkImages, bulkUploading, user, setImagesUploading, storage, firestore, getDisplayName, soundEnabled, clearAllImages, pushToast, forceScrollBottom]);

  const { handleInputActivity } = useTypingPresence({ rtdb, user, soundEnabled });
  const { open: emojiOpen, toggle: toggleEmoji, buttonRef: emojiButtonRef, setOnSelect } = useEmojiPicker();
  const inputRef = React.useRef(null);

  // Auto-focus on initial mount / when user becomes available
  React.useEffect(() => {
    if (user && inputRef.current) {
      // Delay to ensure layout present
      setTimeout(() => {
        try { inputRef.current.focus(); } catch (_) {}
      }, 30);
    }
  }, [user]);

  // Emoji selection handler
  React.useEffect(() => {
    setOnSelect((emojiData) => {
      const emoji = emojiData?.emoji || '';
      if (!emoji) return;
      setText(v => v + emoji);
      if (inputRef.current) inputRef.current.focus();
    });
  }, [setOnSelect]);

  const handleChange = (val) => {
    setText(val);
    handleInputActivity(val.length);
  };

  const sendText = async () => {
    if (!user || !text.trim()) return;
    
    // Clear typing indicator immediately when send is attempted
    handleInputActivity(0);
    
    try {
      await createTextMessage({ 
        firestore, 
        text, 
        user, 
        getDisplayName, 
        replyTo: replyingTo,
        campaignId,
        channelId
      });
      setText('');
      setReplyingTo(null);
      if (soundEnabled) playSendMessageSound(true);
      if (forceScrollBottom) setTimeout(() => forceScrollBottom(), 10);
    } catch (err) {
      console.error('Error sending message', err);
      alert('Failed to send message: ' + err.message);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendText();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  // Prefill listener
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.detail || !e.detail.text) return;
      setText(e.detail.text);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const val = e.detail.text;
          inputRef.current.focus();
          inputRef.current.selectionStart = inputRef.current.selectionEnd = val.length;
        }
      });
    };
    document.addEventListener('chat:prefill', handler);
    return () => document.removeEventListener('chat:prefill', handler);
  }, []);

  // Shortcut: Ctrl/Cmd + I for image file picker
  React.useEffect(() => {
    const handleShortcut = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        const input = document.getElementById('image-upload');
        if (input) input.click();
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const jumpToMessage = (id) => {
    const selector = `[data-message-id="${id}"]`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!el.classList.contains('reply-target')) {
        el.classList.add('reply-target');
        setTimeout(() => el.classList.remove('reply-target'), 3000);
      }
    }
  };

  return (
    <div className="chat-input-area">
      <ImagePreviewModal
        imagePreview={activeImagePreview}
        uploading={isUploading}
        error={imageHook.error}
        onSend={handleSendImage}
        onCancel={handleClearImage}
        onRetry={handleSendImage}
      />
      <BulkImagePreviewModal
        images={bulkImages}
        uploading={bulkUploading}
        error={null}
        onSend={handleSendBulkImages}
        onCancel={handleClearBulkImages}
        onRetry={handleSendBulkImages}
        onRemoveImage={removeImage}
      />
      <ReplyPreview
        replyingTo={replyingTo}
        onCancel={() => setReplyingTo(null)}
        onJump={jumpToMessage}
      />
      <form onSubmit={onSubmit} className="message-form">
        <MessageBar
          text={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPickEmoji={toggleEmoji}
          emojiOpen={emojiOpen}
          emojiButtonRef={emojiButtonRef}
          onTriggerFile={(file) => { if (file) handleLocalFile(file); }}
          onTriggerFiles={(files) => { if (files) handleLocalFiles(files); }}
          textareaRef={inputRef}
        />
        <button type="submit" disabled={!text} className="send-btn" aria-label="Send message">➤</button>
      </form>
    </div>
  );
}

export default ChatInput;
