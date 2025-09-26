import React from 'react';
import './ChatInput.css';
import { useFirebase } from '../../services/FirebaseContext';
import { playSendMessageSound } from '../../utils/sound';
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
  playSendSound: () => playSendMessageSound(true)
  });

  // Determine if parent is controlling (legacy) vs internal self-managed
  const isControlled = React.useMemo(() => (
    liftedSelectedImage !== undefined || liftedImagePreview !== undefined || liftedUploading !== undefined
  ), [liftedSelectedImage, liftedImagePreview, liftedUploading]);

  // In controlled mode: pull values from parent ONLY when they differ
  React.useEffect(() => {
    if (!isControlled) return; // parent drives
    if (liftedSelectedImage !== undefined && liftedSelectedImage !== imageHook.selectedImage) {
      imageHook.setSelectedImage(liftedSelectedImage);
    }
    if (liftedImagePreview !== undefined && liftedImagePreview !== imageHook.imagePreview) {
      imageHook.setImagePreview(liftedImagePreview);
    }
    if (typeof liftedUploading === 'boolean' && liftedUploading !== imageHook.uploading) {
      imageHook.setUploading(liftedUploading);
    }
  }, [isControlled, liftedSelectedImage, liftedImagePreview, liftedUploading, imageHook.selectedImage, imageHook.imagePreview, imageHook.uploading, imageHook]);

  // In uncontrolled (preferred) mode: optionally surface internal state upward only if parent provided setters but not controlling.
  React.useEffect(() => {
    if (isControlled) return; // avoid feedback loop
    if (setLiftedSelectedImage) setLiftedSelectedImage(imageHook.selectedImage);
    if (setLiftedImagePreview) setLiftedImagePreview(imageHook.imagePreview);
    if (setLiftedUploading) setLiftedUploading(imageHook.uploading);
  }, [isControlled, setLiftedSelectedImage, setLiftedImagePreview, setLiftedUploading, imageHook.selectedImage, imageHook.imagePreview, imageHook.uploading]);

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
    try {
      await createTextMessage({ firestore, text, user, getDisplayName, replyTo: replyingTo });
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
