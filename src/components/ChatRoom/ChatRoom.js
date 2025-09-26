import React from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { playReceiveMessageSound } from '../../utils/sound';
import { useDragAndDropImages } from '../../hooks/useDragAndDropImages';
// import { useTypingUsers } from '../../hooks/useTypingUsers'; // currently unused
import { useReplyState } from '../../hooks/useReplyState';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useInfiniteScrollTop } from '../../hooks/useInfiniteScrollTop';
import { useMessageSearch } from '../../hooks/useMessageSearch';
import { useScrollPrependRestoration } from '../../hooks/useScrollPrependRestoration';
import DragOverlay from './DragOverlay';
import MessageList from './MessageList';


function ChatRoom({ getDisplayName, searchTerm, onDragStateChange, replyingTo, setReplyingTo, onImageDrop, onViewProfile, onScrollMeta, soundEnabled = true }) {
  const { firestore, auth /* rtdb */ } = useFirebase();
  const dummy = React.useRef();
  const mainRef = React.useRef();
  // Allow deeper history than the previous hard cap of 100. Defaults to 1000 (configurable via env).
  const historyCap = Number(process.env.REACT_APP_CHAT_MAX_HISTORY) || 1000; // can be raised safely; consider virtualization > ~1500
  const { messages, loadMore, hasMore } = useChatMessages({ firestore, limitBatchSize: 25, maxLimit: historyCap });
  const restoration = useScrollPrependRestoration(mainRef);

  // const typingUsers = useTypingUsers({ rtdb, currentUid: auth.currentUser?.uid }); // reserved for future feature
  const { setReplyTarget } = useReplyState({
    getDisplayName,
    externalReply: replyingTo,
    setExternalReply: setReplyingTo
  });

  const sortedMessages = messages;

  // Play receive sound when a new message arrives from another user (excluding initial load)
  const prevLatestIdRef = React.useRef(null);
  React.useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    if (!latest) return;
    const prevId = prevLatestIdRef.current;
    prevLatestIdRef.current = latest.id;
    if (!prevId) return; // skip initial hydration
    if (soundEnabled && latest.uid && latest.uid !== auth?.currentUser?.uid) {
      playReceiveMessageSound(true);
    }
  }, [messages, auth, soundEnabled]);

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

  const wrappedLoadMore = React.useCallback(() => {
    restoration.markBeforeLoadMore(messages);
    loadMore();
  }, [restoration, loadMore, messages]);

  const { sentinelRef, isFetching: loadingOlder } = useInfiniteScrollTop({
    containerRef: mainRef,
    hasMore,
    onLoadMore: wrappedLoadMore,
    threshold: 0,
    debounceMs: 0,
    cooldownMs: 600,
    enableFallback: true,
  });

  // Auto-fill viewport: if after load we still can't scroll and there are more, load more (guard loop)
  const autoFillRef = React.useRef(0);
  React.useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    if (!hasMore) return; // nothing else
    // If content fits (not scrollable) and we haven't tried too many times, fetch more
    if (el.scrollHeight <= el.clientHeight + 8 && autoFillRef.current < 5) {
      autoFillRef.current += 1;
      wrappedLoadMore();
    }
  }, [messages, hasMore, wrappedLoadMore]);

  // After messages change, run classification/restoration
  const lastBoundaryRef = React.useRef({ len: 0, first: null, last: null });
  React.useEffect(() => {
    const len = messages.length;
    const first = messages[0]?.id || null;
    const last = messages[len - 1]?.id || null;
    const prev = lastBoundaryRef.current;
    if (prev.len === len && prev.first === first && prev.last === last) return; // no meaningful change
    lastBoundaryRef.current = { len, first, last };
    restoration.handleAfterMessages(messages);
  }, [messages, restoration]);

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
            <div
              ref={sentinelRef}
              className={`load-older-sentinel ${loadingOlder ? 'active' : ''}`}
              style={{
                height: loadingOlder ? '36px' : '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {loadingOlder && (
                <>
                  <span className="loading-older-spinner" aria-hidden="true" />
                  <span className="loading-older-label" aria-live="polite">Loading older messages…</span>
                </>
              )}
            </div>
          ) : (
            <div className="history-start-marker" aria-label="Start of conversation">
              <span className="history-start-line" />
              <span className="history-start-text">Start of conversation</span>
              <span className="history-start-line" />
            </div>
          )}
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
