import React from 'react';
import { getFallbackAvatar } from '../../../utils/avatar';
import { useProfanityFilter } from '../../../utils/profanityFilter';
import { useProfanityFilterContext } from '../../../contexts/ProfanityFilterContext';
import { useUserProfileData } from '../../../hooks/useUserProfileData';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { useFirebase } from '../../../services/FirebaseContext';

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
  
  // Get enhanced profile data for this user
  const { profileData } = useUserProfileData(uid);
  
  // For the current user, we should use the profile from the global context
  // For other users, we use the fetched profile data
  const { profile: currentUserProfile } = useUserProfile();
  const { user: currentUser } = useFirebase();

  const effectiveProfileData = uid === currentUser?.uid ? currentUserProfile : profileData;

  // Implement name priority: displayName (highest) > username (medium) > auth displayName (lowest)
  const getDisplayNameWithPriority = () => {
    // Highest priority: Custom display name from profile
    if (effectiveProfileData?.displayName) {
      return effectiveProfileData.displayName;
    }
    // Medium priority: Username from profile
    if (effectiveProfileData?.username) {
      return effectiveProfileData.username;
    }
    // Lowest priority: Original auth display name from message
    return displayName || 'Anonymous';
  };

  const enhancedDisplayName = getDisplayNameWithPriority();

  // Use profile picture from profile data if available, otherwise fallback
  // Also check if the profile picture URL is a placeholder and use fallback instead
  const isPlaceholderURL = (url) => {
    return !url || url.includes('via.placeholder.com') || url.includes('placeholder');
  };
  
  const profilePictureURL = effectiveProfileData?.profilePictureURL;
  const enhancedPhotoURL = isPlaceholderURL(profilePictureURL) ? 
    (isPlaceholderURL(photoURL) ? null : photoURL) : 
    profilePictureURL;

  const fallbackAvatar = React.useMemo(
    () => getFallbackAvatar({ uid: uid || 'x', displayName: enhancedDisplayName, size: 14 }),
    [uid, enhancedDisplayName]
  );

  // Apply profanity filtering to reply text
  const filteredText = useProfanityFilter(text, profanityFilterEnabled);

  if (!replyTo) return null;

  const snippet = (filteredText ? filteredText : (type === 'image' ? 'Image' : '')) || '';

  const handleNavigate = () => { if (id && onNavigate) onNavigate(id); };

  const handleProfile = () => {
    if (onViewProfile) {
      onViewProfile({ 
        uid, 
        displayName: enhancedDisplayName, 
        photoURL: enhancedPhotoURL || fallbackAvatar,
        username: effectiveProfileData?.username,
        bio: effectiveProfileData?.bio,
        statusMessage: effectiveProfileData?.statusMessage,
      });
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
        title={`View ${enhancedDisplayName || 'user'} profile`}
        data-testid="irc-avatar"
      >
        <img
          src={enhancedPhotoURL || fallbackAvatar}
          alt={enhancedDisplayName ? `${enhancedDisplayName} avatar` : 'User avatar'}
            loading="lazy"
            decoding="async"
        />
      </div>
      <button
        className="irc-name"
        onClick={handleProfile}
        title={`View ${enhancedDisplayName || 'user'} profile`}
        type="button"
        data-testid="irc-name-btn"
      >
        {enhancedDisplayName || 'Unknown'}
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
