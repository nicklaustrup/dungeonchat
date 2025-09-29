import React from 'react';
import { ref as databaseRef, onDisconnect as rtdbOnDisconnect, set as rtdbSet, update as rtdbUpdate } from 'firebase/database';
import { useFirebase } from '../services/FirebaseContext';
import { useChatState, useChatTheme, useChatSound, useChatSearch, useChatReply, useChatImage, useChatScroll } from '../contexts/ChatStateContext';
import ChatHeader from '../components/ChatHeader/ChatHeader';
import ChatRoom from '../components/ChatRoom/ChatRoom';
import ChatInput from '../components/ChatInput/ChatInput';
import SignIn from '../components/SignIn/SignIn';
import TypingBubble from '../components/TypingBubble/TypingBubble';
import ScrollToBottomButton from '../components/ChatRoom/ScrollToBottomButton';
// Lazy load rarely used profile modal for bundle splitting (Phase 2)
const UserProfileModal = React.lazy(() => import('../components/UserProfileModal/UserProfileModal'));

function ChatPage() {
  const { user, rtdb } = useFirebase();
  const { state, actions } = useChatState();
  
  // Convenient hooks for specific state slices
  const { isDarkTheme, toggleTheme } = useChatTheme();
  const { soundEnabled, toggleSound } = useChatSound();
  const { searchTerm, showSearch, setSearch } = useChatSearch();
  const { replyingTo, setReplyingTo } = useChatReply();
  const { handleMultipleImageDrop } = useChatImage();
  const { scrollMeta, setScrollMeta } = useChatScroll();

  const getDisplayName = React.useCallback((uid, originalName) => {
    if (uid === user?.uid) return originalName || 'You';
    return originalName || 'Anonymous';
  }, [user?.uid]);

  // Stable no-op used for disabled callbacks
  const noop = React.useCallback(() => {}, []);

  // Persistence for away seconds (moved from App.js)
  React.useEffect(() => {
    localStorage.setItem('awayAfterSeconds', String(state.awayAfterSeconds));
  }, [state.awayAfterSeconds]);

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

  const handleViewProfile = (profileUser) => {
    if (profileUser) {
      actions.setProfileModal(profileUser);
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
        setShowSearch={(show) => setSearch(searchTerm, show)}
        searchTerm={searchTerm}
        setSearchTerm={(term) => setSearch(term, showSearch)}
        onViewProfile={handleViewProfile}
        awayAfterSeconds={state.awayAfterSeconds}
        setAwayAfterSeconds={actions.setAwaySeconds}
      />
      <section>
        {user ? (
          <>
            <div className="chatroom-shell">
            <ChatRoom
              getDisplayName={getDisplayName}
              searchTerm={searchTerm}
              onDragStateChange={noop}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onImageDrop={handleMultipleImageDrop}
              onViewProfile={handleViewProfile}
              onScrollMeta={setScrollMeta}
              soundEnabled={soundEnabled}
            />
            <div className="chatroom-overlays">
              <TypingBubble soundEnabled={soundEnabled} />
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
              forceScrollBottom={() => scrollMeta.scrollToBottom && scrollMeta.scrollToBottom('auto')}
            />
          </>
        ) : (
          <SignIn />
        )}
      </section>
      <React.Suspense fallback={null}>
        {state.profileModalUser && (
          <UserProfileModal
            user={state.profileModalUser}
            isOpen={!!state.profileModalUser}
            onClose={() => actions.setProfileModal(null)}
          />
        )}
      </React.Suspense>
    </div>
  );
}

export default ChatPage;
