// ChatRoom Component - V2 Implementation Only
// Migrated from V1 on 2025-09-27T02:57:53.091Z
// All feature flags and A/B comparison logic removed

import React from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { playReceiveMessageSound } from '../../utils/sound';
import { useDragAndDropImages } from '../../hooks/useDragAndDropImages';
// import { useTypingUsers } from '../../hooks/useTypingUsers'; // currently unused
import { useReplyState } from '../../hooks/useReplyState';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useAutoScrollV2 } from '../../hooks/useAutoScrollV2';
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
    const isNewTail = prevId && latest.id !== prevId; // only treat as new if tail id changed (avoid pagination or reordering noise)
    prevLatestIdRef.current = latest.id;
    if (!prevId) return; // skip initial hydration
    if (!isNewTail) return; // suppress sound on pagination / non-tail mutations
    if (soundEnabled && latest.uid && latest.uid !== auth?.currentUser?.uid) {
      playReceiveMessageSound(true);
    }
  }, [messages, auth, soundEnabled]);

  // V2 Implementation Only (simplified, optimized)
  const { isAtBottom, hasNew: hasNewMessages, newCount: newMessagesCount, scrollToBottom } = useAutoScrollV2({
    containerRef: mainRef,
    anchorRef: dummy,
    items: sortedMessages,
    threshold: 60, // Single threshold for clean behavior
  });

  // Debug logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChatRoom: scroll state changed', { 
        isAtBottom, 
        hasNewMessages, 
        newMessagesCount,
        messageCount: sortedMessages.length 
      });
    }
  }, [isAtBottom, hasNewMessages, newMessagesCount, sortedMessages.length]);

  // Notify parent about scroll meta for external button positioning.
  const lastMetaRef = React.useRef(null);
  React.useEffect(() => {
    if (!onScrollMeta) return;
    const el = mainRef.current;
    let dist = 0;
    if (el) {
      dist = el.scrollHeight - (el.scrollTop + el.clientHeight);
    }
    const bottomThreshold = 60; // keep in sync with hook usage
    const withinReadZone = dist <= bottomThreshold;
    const effectiveAtBottom = isAtBottom || withinReadZone;

    const nextMeta = {
      visible: !effectiveAtBottom,
      hasNew: hasNewMessages,
      newCount: newMessagesCount,
      scrollToBottom, // function reference (stable from V2 hook)
      debugDist: dist,
      debugWithinReadZone: withinReadZone,
      debugIsAtBottom: isAtBottom,
      debugEffectiveAtBottom: effectiveAtBottom,
      debugThreshold: bottomThreshold
    };

    // Shallow compare against last meaningful snapshot to avoid parent updates
    const prev = lastMetaRef.current;
    let changed = false;
    if (!prev) {
      changed = true;
    } else {
      for (const k in nextMeta) {
        if (nextMeta[k] !== prev[k]) { changed = true; break; }
      }
    }
    if (!changed) return;
    lastMetaRef.current = nextMeta;
    onScrollMeta(nextMeta);
  // Intentionally exclude onScrollMeta from dependency array to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAtBottom, hasNewMessages, newMessagesCount, scrollToBottom]);

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
    
    // TEMPORARILY DISABLED: restoration.handleAfterMessages(messages);
    // This might be conflicting with V2 scroll logic
    // const classification = restoration.handleAfterMessages(messages);
    if (process.env.NODE_ENV === 'development') {
      console.log('ChatRoom: restoration disabled for testing');
    }
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
