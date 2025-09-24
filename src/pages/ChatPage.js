import React from 'react';
// Removed nickname feature: no Firestore user profile updates needed here now
import { ref as databaseRef, onDisconnect as rtdbOnDisconnect, set as rtdbSet, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { useFirebase } from '../services/FirebaseContext';
import ChatHeader from '../components/ChatHeader/ChatHeader';
import ChatRoom from '../components/ChatRoom/ChatRoom';
import ChatInput from '../components/ChatInput/ChatInput';
import SignIn from '../components/SignIn/SignIn';

function ChatPage() {
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

  const getDisplayName = React.useCallback((uid, originalName) => {
    if (uid === user?.uid) return originalName || 'You';
    return originalName || 'Anonymous';
  }, [user?.uid]);

  React.useEffect(() => {
    if (user) {
      const userPresenceRef = databaseRef(rtdb, `presence/${user.uid}`);
      const userStatusData = {
        online: true,
        lastSeen: rtdbServerTimestamp(),
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL
      };
      rtdbSet(userPresenceRef, userStatusData);
      rtdbOnDisconnect(userPresenceRef).set({
        online: false,
        lastSeen: rtdbServerTimestamp(),
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL
      });
    }
  }, [user, rtdb]);

  React.useEffect(() => {
    document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);
  const toggleSound = () => setSoundEnabled(!soundEnabled);

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
      />
  <section>
        {user ? (
          <>
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
            />
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
    </div>
  );
}

export default ChatPage;
