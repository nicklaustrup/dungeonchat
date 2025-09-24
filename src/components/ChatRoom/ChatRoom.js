import React from 'react';
import { collection, orderBy, limit, query } from 'firebase/firestore';
import { ref as databaseRef, onValue } from 'firebase/database';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useFirebase } from '../../services/FirebaseContext';
import ChatMessage from './ChatMessage';
function ChatRoom({ getDisplayName, searchTerm, onDragStateChange, replyingTo, setReplyingTo, onImageDrop }) {
  const { firestore, auth, rtdb } = useFirebase();
  const dummy = React.useRef();
  const mainRef = React.useRef();
  const messagesRef = collection(firestore, 'messages');
  const [messageLimit, setMessageLimit] = React.useState(25);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [imageDragReady, setImageDragReady] = React.useState(false);
  const dragCounter = React.useRef(0);
  const windowListenerRef = React.useRef(false);
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit));

  const [messagesSnapshot] = useCollection(q);
  
  const messages = React.useMemo(() => {
    if (!messagesSnapshot) return [];
    return messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }, [messagesSnapshot]);
  
  React.useEffect(() => {
    if (messages && messages.length > 0) {
      console.log('🔍 Sample message structure:', messages[0]);
      console.log('🔍 Message keys:', Object.keys(messages[0]));
      console.log('🔍 Has id field:', 'id' in messages[0]);
    }
  }, [messages]);

  const [typingUsers, setTypingUsers] = React.useState([]);
  const [lastMessageCount, setLastMessageCount] = React.useState(0);

  const sortedMessages = React.useMemo(() => {
    if (!messages) return [];
    return [...messages].reverse();
  }, [messages]);

  const filteredMessages = React.useMemo(() => {
    if (!searchTerm || !sortedMessages) return sortedMessages;
    return sortedMessages.filter(msg => 
      (msg.text && msg.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (msg.type === 'image')
    );
  }, [sortedMessages, searchTerm]);

  const handleScroll = React.useCallback(() => {
    if (mainRef.current) {
      const { scrollTop } = mainRef.current;
      if (scrollTop < 100 && messageLimit < 100) {
        console.log('📜 Loading more messages...');
        setMessageLimit(prev => prev + 25);
      }
    }
  }, [messageLimit]);

  React.useEffect(() => {
    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  React.useEffect(() => {
    if (sortedMessages.length > lastMessageCount && lastMessageCount > 0) {
      const latestMessage = sortedMessages[sortedMessages.length - 1];
      // notification sound now handled in ChatInput if desired
      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setLastMessageCount(sortedMessages ? sortedMessages.length : 0);
  }, [sortedMessages, lastMessageCount, auth.currentUser?.uid]);

  React.useEffect(() => {
    if (sortedMessages.length > 0) {
      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [sortedMessages.length > 0]);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const typingRef = databaseRef(rtdb, 'typing');
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const typing = Object.entries(data)
          .filter(([uid, info]) => uid !== auth.currentUser.uid && info.typing)
          .map(([uid, info]) => ({ uid, displayName: info.displayName }));
        setTypingUsers(typing);
      } else {
        setTypingUsers([]);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser, rtdb]);

  // Image and input handling moved to ChatInput component

  const handleReply = (message) => {
    const messageId = message.id || message.documentId || `temp_${Date.now()}`;
    
    if (!messageId) {
      console.error('❌ Cannot reply: message has no ID');
      alert('Cannot reply to this message - missing ID');
      return;
    }
    
    const baseReply = {
      id: messageId,
      text: message.text || null,
      imageURL: message.imageURL || null,
      type: message.type || (message.imageURL ? 'image' : (message.text ? 'text' : 'meta')),
      uid: message.uid,
      displayName: getDisplayName ? getDisplayName(message.uid, message.displayName) : (message.displayName || 'Anonymous')
    };
    // Remove undefined values explicitly (Firestore rejects undefined)
    const sanitized = Object.fromEntries(Object.entries(baseReply).filter(([_, v]) => v !== undefined));
    setReplyingTo(sanitized);
  };

  // Input handlers removed (handled in ChatInput)

  // Robust image detection (handles empty MIME types during drag in some browsers)
  const detectImageItems = (dataTransfer) => {
    if (!dataTransfer?.items) return false;
    const items = Array.from(dataTransfer.items);
    return items.some(item => {
      if (item.kind !== 'file') return false;
      if (item.type && item.type.startsWith('image/')) return true;
      // Fallback: infer from filename extension when type is '' (Chrome sometimes during drag)
      try {
        const file = item.getAsFile();
        if (!file) return false;
        return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif)$/i.test(file.name);
      } catch { return false; }
    });
  };

  // Global listeners to ensure state resets when leaving window
  React.useEffect(() => {
    if (windowListenerRef.current) return; // only attach once
    const handleWindowDragLeave = (e) => {
      if (e.relatedTarget === null || e.clientX <= 0 || e.clientY <= 0) {
        dragCounter.current = 0;
        setIsDragActive(false);
        setImageDragReady(false);
      }
    };
    const handleWindowDrop = () => {
      dragCounter.current = 0;
      setIsDragActive(false);
      setImageDragReady(false);
    };
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    windowListenerRef.current = true;
    return () => {
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  return (
    <>
      <main
        ref={mainRef}
        className={`${isDragActive ? 'drag-active' : ''} ${imageDragReady ? 'drag-ready' : ''}`.trim()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files && e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/') && onImageDrop) {
            onImageDrop(file);
          }
          dragCounter.current = 0;
          setIsDragActive(false);
          setImageDragReady(false);
          onDragStateChange && onDragStateChange(false, false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragActive) {
            setIsDragActive(true);
            onDragStateChange && onDragStateChange(true, imageDragReady);
          }
          const isImage = detectImageItems(e.dataTransfer);
          if (isImage !== imageDragReady) {
            setImageDragReady(isImage);
            onDragStateChange && onDragStateChange(true, isImage);
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounter.current += 1;
          if (!isDragActive) {
            setIsDragActive(true);
            onDragStateChange && onDragStateChange(true, imageDragReady);
          }
          const ready = detectImageItems(e.dataTransfer);
          if (ready !== imageDragReady) {
            setImageDragReady(ready);
            onDragStateChange && onDragStateChange(true, ready);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounter.current -= 1;
          if (dragCounter.current <= 0) {
            setIsDragActive(false);
            setImageDragReady(false);
            onDragStateChange && onDragStateChange(false, false);
          }
        }}
      >

        {filteredMessages && filteredMessages.map((msg, index) => 
          <ChatMessage 
            key={msg.id || index} 
            message={msg} 
            searchTerm={searchTerm} 
            getDisplayName={getDisplayName}
            onReply={handleReply}
            isReplyTarget={replyingTo && replyingTo.id && msg.id && replyingTo.id === msg.id}
          />
        )}
        
        {searchTerm && filteredMessages && filteredMessages.length === 0 && (
          <div className="no-results">
            No messages found for "{searchTerm}"
          </div>
        )}
        
        {typingUsers.length > 0 && !searchTerm && (
          <div className="typing-indicator">
            <div className="typing-avatar">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <span className="typing-text">
              {typingUsers.map(user => user.displayName).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        )}
        
        <span ref={dummy}></span>
      </main>

      {isDragActive && (
        <div className={`drag-overlay ${imageDragReady ? 'ready' : ''}`}>
          {imageDragReady ? 'Release to upload image' : 'Drag an image file here'}
        </div>
      )}
    </>
  )
}

export default ChatRoom;
