import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../../services/FirebaseContext';
import { useCachedUserProfile } from '../../services/cache';
import './ProfileDisplay.css';

/**
 * ProfileDisplay - Shows user profile information with inline editing capability
 * Used for viewing other users' profiles or current user's profile
 * For own profile, includes inline editing functionality
 */
export function ProfileDisplay({ userId, onClose, onEdit }) {
  const { firestore, user } = useFirebase();
  const {
    updateProfile,
    uploadPicture: uploadProfilePictureFile,
    updatePrivacySettings
  } = useCachedUserProfile();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inline editing state
  const [editingField, setEditingField] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

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
          // Initialize field values for editing if it's own profile
          if (isOwnProfile) {
            setFieldValues({
              username: profileData.username || '',
              displayName: profileData.displayName || '',
              bio: profileData.bio || '',
              profilePictureURL: profileData.profilePictureURL || '',
              profileVisibility: profileData.profileVisibility || 'public',
              showEmail: profileData.showEmail ?? false,
              showLastActive: profileData.showLastActive ?? true
            });
          }
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
  }, [userId, firestore, isOwnProfile]);

  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    return profile?.displayName || 'Anonymous User';
  };

  const formatJoinDate = (timestamp) => {
    if (!timestamp) return 'Unknown';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // const getAuthProviderIcon = (provider) => {
  //   switch (provider) {
  //     case 'google.com': return '🔴';
  //     case 'github.com': return '⚫';
  //     case 'password': return '📧';
  //     default: return '👤';
  //   }
  // };

  // const getAuthProviderName = (provider) => {
  //   switch (provider) {
  //     case 'google.com': return 'Google';
  //     case 'github.com': return 'GitHub';
  //     case 'password': return 'Email';
  //     default: return 'Unknown';
  //   }
  // };

  // Inline editing functions
  const startEditing = (field) => {
    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);
    // Reset field value to original
    if (editingField && profile) {
      setFieldValues(prev => ({
        ...prev,
        [editingField]: profile[editingField] || ''
      }));
    }
  };

  const saveField = async () => {
    if (!editingField) return;

    try {
      setSaving(true);

      // Handle privacy settings separately
      if (['profileVisibility', 'showEmail', 'showLastActive'].includes(editingField)) {
        await updatePrivacySettings({ [editingField]: fieldValues[editingField] });
      } else {
        await updateProfile({ [editingField]: fieldValues[editingField] });
      }

      // Update local profile state
      setProfile(prev => ({ ...prev, [editingField]: fieldValues[editingField] }));
      setEditingField(null);
    } catch (err) {
      console.error('Error saving field:', err);
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (value) => {
    setFieldValues(prev => ({ ...prev, [editingField]: value }));
  };

  // Handle profile picture file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    try {
      setSaving(true);

      // Create preview URL immediately for better UX
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Firebase Storage and update profile
      const downloadURL = await uploadProfilePictureFile(file);

      // Update local state with the actual URL
      setFieldValues(prev => ({ ...prev, profilePictureURL: downloadURL }));
      setProfile(prev => ({ ...prev, profilePictureURL: downloadURL }));

      // Clean up preview URL
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading profile picture: ' + error.message);

      // Clean up preview URL on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      fileInputRef.current?.click();
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
  const currentAvatar = previewUrl || fieldValues.profilePictureURL || profile?.profilePictureURL || `https://via.placeholder.com/120x120?text=${encodeURIComponent(displayName.charAt(0).toUpperCase())}`;

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
              <div className={`avatar-container ${isOwnProfile ? 'editable' : ''}`}>
                <img
                  src={currentAvatar}
                  alt={`${displayName}'s profile`}
                  className="profile-avatar"
                  onClick={handleAvatarClick}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/120x120?text=${encodeURIComponent(displayName.charAt(0).toUpperCase())}`;
                  }}
                />
                {isOwnProfile && (
                  <div className="avatar-overlay" onClick={handleAvatarClick}>
                    <span>📷 Change</span>
                  </div>
                )}
              </div>
              {profile?.statusMessage && (
                <div className="status-message" title="Status message">
                  💬 {profile.statusMessage}
                </div>
              )}
            </div>

            <div className="profile-details">
              <div className="profile-names">
                {/* Username Field - Read Only */}
                {profile?.username && (
                  <div className="profile-field-group">
                    <div className="display-field">
                      <h3 className="username">{fieldValues.username || profile.username}</h3>
                    </div>
                  </div>
                )}

                <div className="profile-metadata">
                  <div className="metadata-item">
                    <span className="metadata-label">Joined</span>
                    <span className="metadata-value">{formatJoinDate(profile?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Field - Inline Editable */}
          <div className="profile-bio-section">
            <div className="profile-field-group">
              <h4>About</h4>
                  {isOwnProfile && editingField === 'bio' ? (
                    <div className="editing-field">
                      <textarea
                        value={fieldValues.bio}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="form-textarea"
                        rows={3}
                        maxLength={500}
                        disabled={saving}
                        autoFocus
                      />
                      <div className="char-count">{(fieldValues.bio || '').length}/500</div>
                      <div className="field-actions">
                        <button
                          className="save-btn"
                          onClick={saveField}
                          disabled={saving}
                          title="Save"
                        >
                          {saving ? '⏳' : '✓'}
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={cancelEditing}
                          disabled={saving}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="display-field">
                      <p>{fieldValues.bio || profile?.bio || (isOwnProfile ? 'Click to add a bio...' : 'No bio available')}</p>
                      {isOwnProfile && (
                        <button
                          className="edit-btn"
                          onClick={() => startEditing('bio')}
                          title="Edit bio"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
        </div>

        {/* Actions */}
        <div className="profile-display-actions">
          <button
            className="button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Hidden file input for profile picture upload */}
        {isOwnProfile && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
}

export default ProfileDisplay;