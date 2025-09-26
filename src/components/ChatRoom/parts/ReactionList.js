import React from 'react';

const ReactionList = ({ reactions, currentUserId, onToggle }) => {
  if (!reactions || Object.keys(reactions).length === 0) return null;
  return (
    <div className="message-reactions" data-testid="reaction-list">
      {Object.entries(reactions).map(([emoji, userIds]) => {
        const isArray = Array.isArray(userIds);
        const count = isArray ? userIds.length : (typeof userIds === 'number' ? userIds : 0);
        const hasUserReacted = isArray ? userIds.includes(currentUserId) : false;
        return (
          <span
            key={emoji}
            className={`reaction ${hasUserReacted ? 'reacted' : ''}`}
            onClick={() => onToggle && onToggle(emoji)}
            onKeyDown={(e) => { if (e.key === 'Enter') onToggle && onToggle(emoji); }}
            role="button"
            tabIndex={0}
            aria-pressed={hasUserReacted}
            aria-label={`${emoji} reaction, ${count} user${count !== 1 ? 's' : ''}. ${hasUserReacted ? 'You reacted.' : 'Activate to toggle your reaction.'}`}
            title={`${count} reaction${count !== 1 ? 's' : ''}`}
            data-testid="reaction-item"
          >{emoji} {count}</span>
        );
      })}
    </div>
  );
};

export default React.memo(ReactionList);
