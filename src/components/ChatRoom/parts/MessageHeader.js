import React from 'react';

export default function MessageHeader({ userName, userId, createdAt, formatTimestamp, onViewProfile, profileData }) {
  // The display name is already calculated in ChatMessage with proper priority
  // but we can double-check here if needed
  const getDisplayName = () => {
    // Display name has already been processed in ChatMessage with proper priority:
    // 1. Custom display name from profile (highest)
    // 2. Username from profile (medium) 
    // 3. Auth display name from message (lowest)
    return userName || 'Anonymous';
  };

  const displayName = getDisplayName();
  const hasCustomProfile = profileData?.username || profileData?.profilePictureURL || profileData?.displayName;

  return (
    <div className="message-header" data-testid="message-header">
      <div
        className={`message-username ${hasCustomProfile ? 'custom-profile' : 'default-profile'}`}
        onClick={onViewProfile}
        onKeyDown={(e) => { if (e.key === 'Enter') onViewProfile(); }}
        style={{ cursor: 'pointer' }}
        title={`View ${displayName}'s profile`}
        role="button"
        tabIndex={0}
        aria-label={`View profile for ${displayName}`}
      >
        {displayName}
        {profileData?.statusMessage && (
          <span className="status-indicator" title={profileData.statusMessage}>
            💬
          </span>
        )}
      </div>
      <time className="message-timestamp" dateTime={createdAt?.toISOString?.()}>
        {formatTimestamp(createdAt)}
      </time>
    </div>
  );
}
