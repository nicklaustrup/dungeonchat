import React from 'react';
// Removed nickname feature: no Firestore user profile updates needed here now
import { ref as databaseRef, onDisconnect as rtdbOnDisconnect, set as rtdbSet, serverTimestamp as rtdbServerTimestamp, update as rtdbUpdate } from 'firebase/database';
import { useFirebase } from '../services/FirebaseContext';
import ChatHeader from '../components/ChatHeader/ChatHeader';
import ChatRoom from '../components/ChatRoom/ChatRoom';
import ChatInput from '../components/ChatInput/ChatInput';
import SignIn from '../components/SignIn/SignIn';
import UserProfileModal from '../components/UserProfileModal/UserProfileModal';
import SettingsModal from '../components/SettingsModal/SettingsModal';
import '../components/UserProfileModal/UserProfileModal.css';
import TypingBubble from '../components/TypingBubble/TypingBubble';
import ScrollToBottomButton from '../components/ChatRoom/ScrollToBottomButton';

function ChatPage({ awayAfterSeconds, setAwayAfterSeconds }) {
  const { user, firestore, rtdb } = useFirebase();
  const [isDarkTheme, setIsDarkTheme] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  // Global drag state no longer needed for border styling (scoped to ChatRoom main)
  const [globalDragActive, setGlobalDragActive] = React.useState(false);
  const [globalDragReady, setGlobalDragReady] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState(null);
  // Lifted image upload state so drag-drop in ChatRoom can populate ChatInput
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [profileModalUser, setProfileModalUser] = React.useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [scrollMeta, setScrollMeta] = React.useState({ visible: false, hasNew: false, newCount: 0, scrollToBottom: null });

  const getDisplayName = React.useCallback((uid, originalName) => {
    if (uid === user?.uid) return originalName || 'You';
    return originalName || 'Anonymous';
  }, [user?.uid]);

  React.useEffect(() => {
    if (!user) return;
    const userPresenceRef = databaseRef(rtdb, `presence/${user.uid}`);
    const writePresence = (online = true) => {
      rtdbUpdate(userPresenceRef, {
        online,
        lastSeen: Date.now(),
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null
      }).catch(() => {
        // fallback to set if update fails (first write)
        rtdbSet(userPresenceRef, {
          online,
          lastSeen: Date.now(),
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || null
        });
      });
    };
    // Initial write
    writePresence(true);
    rtdbOnDisconnect(userPresenceRef).set({
      online: false,
      lastSeen: Date.now(),
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || null
    });
    const heartbeat = setInterval(() => writePresence(true), 45000); // 45s
    const onFocus = () => writePresence(true);
    const onVisibility = () => { if (document.visibilityState === 'visible') writePresence(true); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, rtdb]);

  React.useEffect(() => {
    document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);
  const toggleSound = () => setSoundEnabled(!soundEnabled);

  const handleViewProfile = (profileUser) => {
    if (profileUser) {
      // Ensure we have the full user object if needed, for now this is fine
      setProfileModalUser(profileUser);
    }
  };

  return (
    <div className="App">
      <ChatHeader
        user={user}
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onViewProfile={handleViewProfile}
        awayAfterSeconds={awayAfterSeconds}
        setAwayAfterSeconds={setAwayAfterSeconds}
      />
      <section>
        {user ? (
          <>
            <div className="chatroom-shell">
            <ChatRoom
              getDisplayName={getDisplayName}
              searchTerm={searchTerm}
              onDragStateChange={(active, ready) => { setGlobalDragActive(active); setGlobalDragReady(ready); }}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onImageDrop={(file) => {
                if (!file) return;
                setSelectedImage(file);
                const reader = new FileReader();
                reader.onload = (e) => setImagePreview(e.target.result);
                reader.readAsDataURL(file);
              }}
              onViewProfile={handleViewProfile}
              onScrollMeta={setScrollMeta}
            />
            <div className="chatroom-overlays">
              <TypingBubble />
              <div className="scroll-btn-wrapper">
                <ScrollToBottomButton
                  visible={scrollMeta.visible || scrollMeta.hasNew}
                  hasNew={scrollMeta.hasNew}
                  newCount={scrollMeta.newCount}
                  onClick={() => scrollMeta.scrollToBottom && scrollMeta.scrollToBottom('smooth')}
                />
              </div>
            </div>
            </div>
            <ChatInput
              getDisplayName={getDisplayName}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              soundEnabled={soundEnabled}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              uploading={uploading}
              setUploading={setUploading}
            />
          </>
        ) : (
          <SignIn />
        )}
      </section>
      <UserProfileModal
        user={profileModalUser}
        isOpen={!!profileModalUser}
        onClose={() => setProfileModalUser(null)}
      />
    </div>
  );
}

export default ChatPage;
