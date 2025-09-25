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

  const formatDateHeading = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  let lastDateKey = null;

  return (
    <>
      {topSentinel}
      {messages && messages.map(m => {
        const ts = m.createdAt;
        const dateObj = ts ? (ts.toDate ? ts.toDate() : new Date(ts)) : null;
        const dateKey = dateObj ? dateObj.getFullYear()+ '-' + (dateObj.getMonth()+1) + '-' + dateObj.getDate() : null;
        let showDivider = false;
        if (dateKey && dateKey !== lastDateKey) {
          // Only show if not first OR if the gap is >= 1 day from previous
          if (lastDateKey !== null) {
            showDivider = true;
          } else {
            // First message of list: we don't show divider before it
            showDivider = false;
          }
        }
        const content = (
          <ChatMessage
            key={m.id}
            message={m}
            searchTerm={searchTerm}
            onReply={onReply}
            isReplyTarget={replyingToId && m.id === replyingToId}
            onViewProfile={onViewProfile}
          />
        );
        const elements = [];
        if (showDivider) {
            elements.push(
              <div className="date-divider" key={`div-${m.id}`}>
                <span className="date-divider-label">{formatDateHeading(ts)}</span>
              </div>
            );
        }
        if (dateKey) lastDateKey = dateKey;
        elements.push(content);
        return elements;
      })}
      {showTyping && <TypingIndicator users={typingUsers} />}
      <span ref={bottomAnchorRef} style={{ display: 'block', height: '1px' }}></span>
    </>
  );
}

export default React.memo(MessageList);