import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../../services/FirebaseContext';
import './ProfileDisplay.css';

/**
 * ProfileDisplay - Shows user profile information
 * Used for viewing other users' profiles or current user's profile
 */
export function ProfileDisplay({ userId, onClose, onEdit }) {
  const { firestore, user } = useFirebase();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    if (!userId || !firestore) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const profileRef = doc(firestore, 'userProfiles', userId);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setProfile(profileData);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, firestore]);

  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    return profile?.displayName || 'Anonymous User';
  };

  const getAvatarUrl = () => {
    if (profile?.profilePictureURL) {
      return profile.profilePictureURL;
    }
    const displayName = getDisplayName();
    return `https://via.placeholder.com/120x120?text=${encodeURIComponent(displayName.charAt(0).toUpperCase())}`;
  };

  const formatJoinDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getAuthProviderIcon = (provider) => {
    switch (provider) {
      case 'google.com': return '🔴';
      case 'github.com': return '⚫';
      case 'password': return '📧';
      default: return '👤';
    }
  };

  const getAuthProviderName = (provider) => {
    switch (provider) {
      case 'google.com': return 'Google';
      case 'github.com': return 'GitHub';
      case 'password': return 'Email';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="profile-display-overlay">
        <div className="profile-display loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-display-overlay">
        <div className="profile-display error">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="button-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName();
  const avatarUrl = getAvatarUrl();

  return (
    <div className="profile-display-overlay" onClick={onClose}>
      <div className="profile-display" onClick={(e) => e.stopPropagation()}>
        <div className="profile-display-header">
          <h2>{isOwnProfile ? 'Your Profile' : `${displayName}'s Profile`}</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close profile"
          >
            ×
          </button>
        </div>

        <div className="profile-display-content">
          {/* Profile Picture and Basic Info */}
          <div className="profile-main-info">
            <div className="profile-avatar-section">
              <img 
                src={avatarUrl}
                alt={`${displayName}'s profile`}
                className="profile-avatar"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/120x120?text=${encodeURIComponent(displayName.charAt(0).toUpperCase())}`;
                }}
              />
              {profile?.statusMessage && (
                <div className="status-message" title="Status message">
                  💬 {profile.statusMessage}
                </div>
              )}
            </div>

            <div className="profile-details">
              <div className="profile-names">
                {profile?.username && (
                  <h3 className="username">@{profile.username}</h3>
                )}
                {profile?.displayName && profile.displayName !== profile?.username && (
                  <p className="display-name">{profile.displayName}</p>
                )}
              </div>

              {profile?.bio && (
                <div className="profile-bio">
                  <h4>About</h4>
                  <p>{profile.bio}</p>
                </div>
              )}

              <div className="profile-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Joined</span>
                  <span className="metadata-value">{formatJoinDate(profile?.createdAt)}</span>
                </div>
                
                {profile?.authProvider && (
                  <div className="metadata-item">
                    <span className="metadata-label">Sign-in method</span>
                    <span className="metadata-value">
                      {getAuthProviderIcon(profile.authProvider)} {getAuthProviderName(profile.authProvider)}
                    </span>
                  </div>
                )}

                {profile?.showEmail && profile?.email && (
                  <div className="metadata-item">
                    <span className="metadata-label">Email</span>
                    <span className="metadata-value">{profile.email}</span>
                  </div>
                )}

                {profile?.emailVerified && (
                  <div className="metadata-item">
                    <span className="metadata-label">Email verified</span>
                    <span className="metadata-value verified">✓ Verified</span>
                  </div>
                )}

                <div className="metadata-item">
                  <span className="metadata-label">Profile visibility</span>
                  <span className="metadata-value">
                    {profile?.profileVisibility === 'private' && '🔒 Private'}
                    {profile?.profileVisibility === 'friends' && '👥 Friends only'}
                    {(!profile?.profileVisibility || profile?.profileVisibility === 'public') && '🌐 Public'}
                  </span>
                </div>

                {profile?.showLastActive && profile?.lastActive && (
                  <div className="metadata-item">
                    <span className="metadata-label">Last active</span>
                    <span className="metadata-value">{formatJoinDate(profile.lastActive)}</span>
                  </div>
                )}

                {profile?.showEmail !== undefined && (
                  <div className="metadata-item">
                    <span className="metadata-label">Email visibility</span>
                    <span className="metadata-value">
                      {profile.showEmail ? '👁️ Visible on profile' : '🔒 Hidden from profile'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-display-actions">
          {isOwnProfile && onEdit && (
            <button 
              className="button-primary"
              onClick={onEdit}
            >
              Edit Profile
            </button>
          )}
          <button 
            className="button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDisplay;