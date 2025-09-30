import React from 'react';

export default function MessageHeader({ userName, userId, createdAt, formatTimestamp, onViewProfile, profileData }) {
  // Determine display name based on profile data
  const getDisplayName = () => {
    if (profileData?.username) {
      return profileData.username;
    }
    return userName || 'Anonymous';
  };

  // Get avatar URL from profile
  const getAvatarUrl = () => {
    if (profileData?.profilePictureURL) {
      return profileData.profilePictureURL;
    }
    // Fallback to a placeholder based on username
    const displayName = getDisplayName();
    return `https://via.placeholder.com/32x32?text=${encodeURIComponent(displayName.charAt(0).toUpperCase())}`;
  };

  const displayName = getDisplayName();
  const avatarUrl = getAvatarUrl();
  const hasCustomProfile = profileData?.username || profileData?.profilePictureURL;

  return (
    <div className="message-header" data-testid="message-header">
      <div className="message-user-info">
        <img 
          src={avatarUrl}
          alt={`${displayName}'s avatar`}
          className={`message-avatar ${hasCustomProfile ? 'custom' : 'default'}`}
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.target.src = `https://via.placeholder.com/32x32?text=${encodeURIComponent(displayName.charAt(0).toUpperCase())}`;
          }}
        />
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
      </div>
      <div className="message-timestamp">{formatTimestamp(createdAt)}</div>
    </div>
  );
}
