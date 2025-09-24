import React from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

function MessageList({
  messages,
  searchTerm,
  replyingToId,
  onReply,
  onViewProfile,
  showTyping,
  typingUsers,
  topSentinel,
  bottomAnchorRef
}) {
  if (searchTerm && messages && messages.length === 0) {
    return (
      <>
        {topSentinel}
        <div className="no-results">No messages found for "{searchTerm}"</div>
        <span ref={bottomAnchorRef}></span>
      </>
    );
  }

  return (
    <>
  {topSentinel}
      {messages && messages.map(m => (
        <ChatMessage
          key={m.id}
          message={m}
          searchTerm={searchTerm}
          onReply={onReply}
          isReplyTarget={replyingToId && m.id === replyingToId}
          onViewProfile={onViewProfile}
        />
      ))}
      {showTyping && <TypingIndicator users={typingUsers} />}
  <span ref={bottomAnchorRef} style={{ display: 'block', height: '1px' }}></span>
    </>
  );
}

export default React.memo(MessageList);