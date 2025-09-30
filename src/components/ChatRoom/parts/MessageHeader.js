import React from 'react';

export default function MessageHeader({ userName, userId, createdAt, formatTimestamp, onViewProfile, profileData }) {
  // Determine display name based on profile data
  const getDisplayName = () => {
    if (profileData?.username) {
      return profileData.username;
    }
    return userName || 'Anonymous';
  };

  const displayName = getDisplayName();
  const hasCustomProfile = profileData?.username || profileData?.profilePictureURL;

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
