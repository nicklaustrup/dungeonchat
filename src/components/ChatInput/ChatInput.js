import React from 'react';
import './ChatInput.css';
import { useFirebase } from '../../services/FirebaseContext';
import { playSendMessageSound } from '../../utils/sound';
import { createTextMessage } from '../../services/messageService';
import { useChatReply, useChatImage } from '../../contexts/ChatStateContext';
import { useImageMessage } from '../../hooks/useImageMessage';
import { useTypingPresence } from '../../hooks/useTypingPresence';
import { useEmojiPicker } from '../../hooks/useEmojiPicker';
import { ReplyPreview } from './ReplyPreview';
import { ImagePreviewModal } from './ImagePreviewModal';
import { MessageBar } from './MessageBar';

function ChatInput({
  getDisplayName,
  soundEnabled,
  forceScrollBottom
}) {
  const { auth, firestore, rtdb, storage } = useFirebase();
  const user = auth.currentUser;
  const [text, setText] = React.useState('');

  // Use centralized state instead of prop drilling  
  const { replyingTo, setReplyingTo } = useChatReply();
  const { preview, uploading, setImageState, clearImage } = useChatImage();

  // Image handling - simplified approach
  const imageHook = useImageMessage({
    storage,
    firestore,
    user,
    getDisplayName,
    soundEnabled,
    playSendSound: () => playSendMessageSound(true)
  });

  const handleLocalFile = React.useCallback((file) => {
    imageHook.handleImageSelect(file);
    // Update context to match hook state (but don't create cycles)
    setImageState({
      selectedFile: file,
      preview: null // Will be updated when FileReader completes
    });
  }, [imageHook, setImageState]);
  
  const handleClearImage = React.useCallback(() => {
    imageHook.clearImage();
    clearImage();
  }, [imageHook, clearImage]);

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
        imagePreview={preview}
        uploading={uploading}
        error={imageHook.error}
        onSend={imageHook.sendImageMessage}
        onCancel={handleClearImage}
        onRetry={imageHook.sendImageMessage}
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
          textareaRef={inputRef}
        />
        <button type="submit" disabled={!text} className="send-btn" aria-label="Send message">➤</button>
      </form>
    </div>
  );
}

export default ChatInput;
