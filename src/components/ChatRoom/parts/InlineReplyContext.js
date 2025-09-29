import React from 'react';
import { getFallbackAvatar } from '../../../utils/avatar';
import { useProfanityFilter } from '../../../utils/profanityFilter';
import { useProfanityFilterContext } from '../../../contexts/ProfanityFilterContext';

/**
 * InlineReplyContext
 * Displays a compact reference to the replied-to message (avatar, name, snippet).
 * Props:
 *  - replyTo: { id, uid, displayName, text, type, photoURL }
 *  - onViewProfile(userLike)
 *  - onNavigate(id) -> called when snippet clicked/Enter (for scrolling + highlight)
 */
export default function InlineReplyContext({ replyTo, onViewProfile, onNavigate }) {
  // Get user's profanity filter preference from context (will re-render when changed)
  const { profanityFilterEnabled } = useProfanityFilterContext();

  // Always declare hooks before any early returns to satisfy rules-of-hooks.
  const { id, uid, displayName, text, type, photoURL } = replyTo || {};
  const fallbackAvatar = React.useMemo(
    () => getFallbackAvatar({ uid: uid || 'x', displayName, size: 24 }),
    [uid, displayName]
  );

  // Apply profanity filtering to reply text
  const filteredText = useProfanityFilter(text, profanityFilterEnabled);

  if (!replyTo) return null;

  const snippet = (filteredText ? filteredText : (type === 'image' ? 'Image' : '')) || '';

  const handleNavigate = () => { if (id && onNavigate) onNavigate(id); };

  const handleProfile = () => {
    if (onViewProfile) {
      onViewProfile({ uid, displayName, photoURL: photoURL || fallbackAvatar });
    }
  };

  return (
    <div className="inline-reply-context" data-testid="inline-reply-context">
      <span className="irc-glyph" aria-hidden="true">❝</span>
      <div
        className="irc-avatar"
        role="button"
        tabIndex={0}
        onClick={handleProfile}
        onKeyDown={(e) => { if (e.key === 'Enter') handleProfile(); }}
        title={`View ${displayName || 'user'} profile`}
        data-testid="irc-avatar"
      >
        <img
          src={photoURL || fallbackAvatar}
            alt={displayName ? `${displayName} avatar` : 'User avatar'}
            loading="lazy"
            decoding="async"
        />
      </div>
      <button
        className="irc-name"
        onClick={handleProfile}
        title={`View ${displayName || 'user'} profile`}
        type="button"
        data-testid="irc-name-btn"
      >
        {displayName || 'Unknown'}
      </button>
      <span
        className="irc-text"
        role={id ? 'link' : undefined}
        tabIndex={id ? 0 : -1}
        onClick={handleNavigate}
        onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
        title={snippet}
        data-testid="irc-snippet"
      >
        {snippet}
      </span>
      <span className="irc-glyph rotate-180" aria-hidden="true">❝</span>
    </div>
  );
}
