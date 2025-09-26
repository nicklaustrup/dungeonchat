import React from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { useDragAndDropImages } from '../../hooks/useDragAndDropImages';
import { useTypingUsers } from '../../hooks/useTypingUsers';
import { useReplyState } from '../../hooks/useReplyState';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useInfiniteScrollTop } from '../../hooks/useInfiniteScrollTop';
import { useMessageSearch } from '../../hooks/useMessageSearch';
import DragOverlay from './DragOverlay';
import MessageList from './MessageList';


function ChatRoom({ getDisplayName, searchTerm, onDragStateChange, replyingTo, setReplyingTo, onImageDrop, onViewProfile, onScrollMeta }) {
  const { firestore, auth, rtdb } = useFirebase();
  const dummy = React.useRef();
  const mainRef = React.useRef();
  const { messages, loadMore, hasMore } = useChatMessages({ firestore, limitBatchSize: 25, maxLimit: 100 });

  const typingUsers = useTypingUsers({ rtdb, currentUid: auth.currentUser?.uid });
  const { setReplyTarget } = useReplyState({
    getDisplayName,
    externalReply: replyingTo,
    setExternalReply: setReplyingTo
  });

  const sortedMessages = messages;

  const { isAtBottom, hasNew: hasNewMessages, newCount: newMessagesCount, scrollToBottom } = useAutoScroll({
    containerRef: mainRef,
    anchorRef: dummy,
    items: sortedMessages,
    bottomThreshold: 60,
  });

  // Notify parent about scroll meta for external button positioning
  React.useEffect(() => {
    if (!onScrollMeta) return;
    onScrollMeta({
      visible: !isAtBottom,
      hasNew: hasNewMessages,
      newCount: newMessagesCount,
      scrollToBottom,
    });
  }, [onScrollMeta, isAtBottom, hasNewMessages, newMessagesCount, scrollToBottom]);

  const filteredMessages = useMessageSearch(sortedMessages, searchTerm);

  const { sentinelRef, isFetching: loadingOlder } = useInfiniteScrollTop({
    containerRef: mainRef,
    hasMore,
    onLoadMore: loadMore,
    threshold: 0,
    debounceMs: 120,
  });

  const { isDragActive, imageReady: imageDragReady, bind: dragBind } = useDragAndDropImages({
    onImage: onImageDrop,
    onStateChange: onDragStateChange
  });

  // Manage transient 'scrolling' class so CSS can reveal scrollbar while in motion
  React.useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let scrollingTimeout;
    const handleScroll = () => {
      if (!el.classList.contains('scrolling')) {
        el.classList.add('scrolling');
      }
      clearTimeout(scrollingTimeout);
      scrollingTimeout = setTimeout(() => {
        el.classList.remove('scrolling');
      }, 650); // delay before hiding again after user stops
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollingTimeout);
    };
  }, []);

  return (
    <div className={`chatroom-wrapper ${isDragActive ? 'drag-active' : ''} ${imageDragReady ? 'drag-ready' : ''}`.trim()}>
      <main
        ref={mainRef}
        {...dragBind}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat messages"
        tabIndex={-1}
      >

        <MessageList
          messages={filteredMessages}
          searchTerm={searchTerm}
          replyingToId={replyingTo?.id}
          onReply={setReplyTarget}
          onViewProfile={onViewProfile}
          showTyping={false}
          typingUsers={[]}
          topSentinel={hasMore ? (
            <div ref={sentinelRef} className="load-older-sentinel" style={{ height: '2px' }}>
              {loadingOlder && <span className="loading-older">Loading older messages…</span>}
            </div>
          ) : null}
          bottomAnchorRef={dummy}
        />
        {/* ScrollToBottomButton lifted to parent overlay */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {hasNewMessages && `${newMessagesCount} new message${newMessagesCount > 1 ? 's' : ''} available`}
        </div>
      </main>
      <DragOverlay active={isDragActive} ready={imageDragReady} />
    </div>
  )
}

export default ChatRoom;
