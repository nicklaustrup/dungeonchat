import React from 'react';

export default function MessageHeader({ userName, createdAt, formatTimestamp, onViewProfile }) {
  return (
    <div className="message-header" data-testid="message-header">
      <div
        className="message-username"
        onClick={onViewProfile}
        onKeyDown={(e) => { if (e.key === 'Enter') onViewProfile(); }}
        style={{ cursor: 'pointer' }}
        title={`View ${userName}'s profile`}
        role="button"
        tabIndex={0}
        aria-label={`View profile for ${userName}`}
      >{userName}</div>
      <div className="message-timestamp">{formatTimestamp(createdAt)}</div>
    </div>
  );
}
