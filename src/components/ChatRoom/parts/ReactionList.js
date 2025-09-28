import React from 'react';

// Build a concise summary string like: "3 reactions: 👍 x2, ❤️ x1"
function buildSummary(reactions) {
  const entries = Object.entries(reactions || {});
  if (!entries.length) return '';
  let total = 0;
  const parts = entries.map(([emoji, userIds]) => {
    const isArray = Array.isArray(userIds);
    const count = isArray ? userIds.length : (typeof userIds === 'number' ? userIds : 0);
    total += count;
    return `${emoji} x${count}`;
  });
  return `${total} reaction${total !== 1 ? 's' : ''}: ${parts.join(', ')}`;
}

const ReactionList = ({ reactions, currentUserId, onToggle }) => {
  // Filter out reactions with zero count (empty arrays or zero values)
  const validReactions = React.useMemo(() => {
    if (!reactions) return {};
    
    const filtered = {};
    Object.entries(reactions).forEach(([emoji, userIds]) => {
      const isArray = Array.isArray(userIds);
      const count = isArray ? userIds.length : (typeof userIds === 'number' ? userIds : 0);
      if (count > 0) {
        filtered[emoji] = userIds;
      }
    });
    return filtered;
  }, [reactions]);

  const hasReactions = Object.keys(validReactions).length > 0;
  const [liveText, setLiveText] = React.useState('');
  const summary = React.useMemo(() => buildSummary(validReactions), [validReactions]);

  // Debounced live region updates to prevent chatter when multiple reactions toggle quickly.
  React.useEffect(() => {
    if (!hasReactions) { setLiveText(''); return; }
    let timer = setTimeout(() => setLiveText(summary), 200);
    return () => clearTimeout(timer);
  }, [summary, hasReactions]);

  if (!hasReactions) return null;

  return (
    <div
      className="message-reactions"
      data-testid="reaction-list"
      role="group"
      aria-label={summary}
    >
      {/* Visually hidden live region */}
      <span
        aria-live="polite"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', border: 0 }}
        data-testid="reaction-live-region"
      >{liveText}</span>
      {Object.entries(validReactions).map(([emoji, userIds]) => {
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
