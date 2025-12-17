import React from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

// Memoized date formatter to avoid recreating function on every render
const formatDateHeading = (ts) => {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Memoized date key calculator to optimize date divider logic
const getDateKey = (ts) => {
  if (!ts) return null;
  const dateObj = ts.toDate ? ts.toDate() : new Date(ts);
  return (
    dateObj.getFullYear() +
    "-" +
    (dateObj.getMonth() + 1) +
    "-" +
    dateObj.getDate()
  );
};

function MessageList({
  messages,
  searchTerm,
  replyingToId,
  onReply,
  onViewProfile,
  showTyping,
  typingUsers,
  topSentinel,
  bottomAnchorRef,
  campaignId,
}) {
  const [selectedMessageId, setSelectedMessageId] = React.useState(null);
  const [hoveredMessageId, setHoveredMessageId] = React.useState(null);
  const handleHoverMessage = React.useCallback(
    (id) => setHoveredMessageId(id),
    []
  );

  // Mobile: allow tapping the same message to deselect & hide reactions
  const handleSelectMessageToggle = React.useCallback(
    (id, currentlySelected) => {
      setSelectedMessageId(currentlySelected ? null : id);
    },
    []
  );

  // Global listeners to clear selection when user focuses input or taps outside any message
  React.useEffect(() => {
    const clearIfOutside = (e) => {
      // Ignore if already no selection
      if (!selectedMessageId) return;
      const msgEl = e.target.closest && e.target.closest(".message");
      if (!msgEl) setSelectedMessageId(null);
    };
    const handleFocusIn = (e) => {
      if (!selectedMessageId) return;
      const msgEl = e.target.closest && e.target.closest(".message");
      if (!msgEl) setSelectedMessageId(null);
    };
    document.addEventListener("pointerdown", clearIfOutside, true);
    document.addEventListener("focusin", handleFocusIn, true);
    return () => {
      document.removeEventListener("pointerdown", clearIfOutside, true);
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }, [selectedMessageId]);
  // Memoize the computed message elements to avoid recalculating on every render
  const messageElements = React.useMemo(() => {
    if (!messages) return [];

    let lastDateKey = null;
    let prevUid = null;

    return messages.flatMap((m) => {
      const ts = m.createdAt;
      const dateKey = getDateKey(ts);

      let showDivider = false;
      if (dateKey && dateKey !== lastDateKey && lastDateKey !== null) {
        showDivider = true;
      }

      // Determine if this message should show meta (avatar/name/timestamp)
      const baseShowMeta = showDivider || prevUid !== m.uid;
      const showMeta = baseShowMeta || !!m.replyTo; // always show meta if quoting another message

      const messageComponent = (
        <ChatMessage
          key={m.id}
          message={m}
          searchTerm={searchTerm}
          onReply={onReply}
          isReplyTarget={replyingToId && m.id === replyingToId}
          onViewProfile={onViewProfile}
          showMeta={showMeta}
          selected={selectedMessageId === m.id}
          // Pass toggle-aware handler so tapping the selected message again deselects on touch devices
          onSelectMessage={(id) =>
            handleSelectMessageToggle(id, selectedMessageId === m.id)
          }
          hovered={hoveredMessageId === m.id}
          onHoverMessage={handleHoverMessage}
          campaignId={campaignId}
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
      prevUid = m.uid;
      elements.push(messageComponent);
      return elements;
    });
  }, [
    messages,
    searchTerm,
    replyingToId,
    onReply,
    onViewProfile,
    selectedMessageId,
    hoveredMessageId,
    handleSelectMessageToggle,
    handleHoverMessage,
    campaignId,
  ]);

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
      {messageElements}
      {showTyping && <TypingIndicator users={typingUsers} />}
      <span
        ref={bottomAnchorRef}
        style={{ display: "block", height: "1px" }}
      ></span>
    </>
  );
}

export default React.memo(MessageList);
