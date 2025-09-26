import React from 'react';
import { getFallbackAvatar } from '../../../utils/avatar';

/**
 * AvatarWithPresence
 * Renders a user avatar with a presence status indicator.
 * Handles fallback avatar generation and error substitution.
 */
export default function AvatarWithPresence({
  uid,
  photoURL,
  displayName,
  presenceState = 'offline',
  presenceTitle = '',
  size = 36,
  onClick,
}) {
  const fallback = React.useMemo(() => getFallbackAvatar({ uid, displayName, size: size + 4 }), [uid, displayName, size]);
  const initialSrc = photoURL || fallback;
  const [src, setSrc] = React.useState(initialSrc);
  const handleError = React.useCallback((e) => {
    if (e.target.dataset.fallbackApplied === 'true') return;
    setSrc(fallback);
    e.target.dataset.fallbackApplied = 'true';
  }, [fallback]);

  return (
    <div
      className="avatar-container"
      role="button"
      tabIndex={0}
      title={`View ${displayName || 'user'}'s profile`}
      aria-label={`View ${displayName || 'user'}'s profile`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick && onClick(e); }}
      data-testid="avatar-with-presence"
    >
      <img
        src={src}
        alt={displayName ? `${displayName}'s avatar` : 'User avatar'}
        className="message-avatar"
        style={{ width: size, height: size }}
        loading="lazy"
        decoding="async"
        onError={handleError}
        data-testid="avatar-image"
        data-current-src={src}
      />
      <div
        className={`status-indicator ${presenceState}`}
        title={presenceTitle}
        aria-label={presenceTitle}
        data-testid="status-indicator"
      />
    </div>
  );
}
