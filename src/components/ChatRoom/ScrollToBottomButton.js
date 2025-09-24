import React from 'react';

function ScrollToBottomButton({ visible, hasNew, newCount, onClick }) {
  if (!visible) return null;
  const label = hasNew ? `${newCount} new message${newCount > 1 ? 's' : ''}` : 'Scroll to bottom';
  return (
    <button
      type="button"
      className={`scroll-to-bottom-btn ${hasNew ? 'new' : ''}`}
      onClick={onClick}
      aria-label={hasNew ? 'Scroll to latest new messages' : 'Scroll to bottom'}
    >
      {label}
    </button>
  );
}

export default React.memo(ScrollToBottomButton);
