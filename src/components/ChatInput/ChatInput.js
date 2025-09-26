import React from 'react';
import './ChatInput.css';
import { useFirebase } from '../../services/FirebaseContext';
import { playNotificationSound } from '../../utils/sound';
import { createTextMessage } from '../../services/messageService';
import { useImageMessage } from '../../hooks/useImageMessage';
import { useTypingPresence } from '../../hooks/useTypingPresence';
import { useEmojiPicker } from '../../hooks/useEmojiPicker';
import { ReplyPreview } from './ReplyPreview';
import { ImagePreviewModal } from './ImagePreviewModal';
import { MessageBar } from './MessageBar';

function ChatInput({
  getDisplayName,
  replyingTo,
  setReplyingTo,
  soundEnabled,
  selectedImage: liftedSelectedImage, // legacy props (will phase out)
  setSelectedImage: setLiftedSelectedImage,
  imagePreview: liftedImagePreview,
  setImagePreview: setLiftedImagePreview,
  uploading: liftedUploading,
  setUploading: setLiftedUploading,
  forceScrollBottom
}) {
  const { auth, firestore, rtdb, storage } = useFirebase();
  const user = auth.currentUser;
  const [text, setText] = React.useState('');

  // Image handling (prefer internal if parent not controlling)
  const imageHook = useImageMessage({
    storage,
    firestore,
    user,
    getDisplayName,
    soundEnabled,
    playSendSound: () => playNotificationSound(true)
  });

  // If parent still passes lifted state, sync it (transition support)
  React.useEffect(() => {
    if (liftedSelectedImage && !imageHook.selectedImage) imageHook.setSelectedImage(liftedSelectedImage);
    if (liftedImagePreview && !imageHook.imagePreview) imageHook.setImagePreview(liftedImagePreview);
    if (typeof liftedUploading === 'boolean' && liftedUploading !== imageHook.uploading) imageHook.setUploading(liftedUploading);
    // Only react to external lifted props and internal selected/uploading state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liftedSelectedImage, liftedImagePreview, liftedUploading, imageHook.selectedImage, imageHook.imagePreview, imageHook.uploading]);

  React.useEffect(() => {
    // push internal state back up to parent for compatibility
    if (setLiftedSelectedImage) setLiftedSelectedImage(imageHook.selectedImage);
    if (setLiftedImagePreview) setLiftedImagePreview(imageHook.imagePreview);
    if (setLiftedUploading) setLiftedUploading(imageHook.uploading);
  }, [setLiftedSelectedImage, setLiftedImagePreview, setLiftedUploading, imageHook.selectedImage, imageHook.imagePreview, imageHook.uploading]);

  const { handleInputActivity } = useTypingPresence({ rtdb, user, soundEnabled });
  const { open: emojiOpen, toggle: toggleEmoji, buttonRef: emojiButtonRef, setOnSelect } = useEmojiPicker();
  const inputRef = React.useRef(null);

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
    try {
      await createTextMessage({ firestore, text, user, getDisplayName, replyTo: replyingTo });
      setText('');
      setReplyingTo(null);
      if (soundEnabled) playNotificationSound(true);
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
        imagePreview={imageHook.imagePreview}
        uploading={imageHook.uploading}
        onSend={imageHook.sendImageMessage}
        onCancel={imageHook.clearImage}
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
          onTriggerFile={imageHook.handleImageSelect}
          textareaRef={inputRef}
        />
        <button type="submit" disabled={!text} className="send-btn" aria-label="Send message">➤</button>
      </form>
    </div>
  );
}

export default ChatInput;
