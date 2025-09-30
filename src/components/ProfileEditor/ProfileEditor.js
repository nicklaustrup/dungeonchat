import React, { useState, useRef } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import './ProfileEditor.css';

/**
 * ProfileEditor - Comprehensive profile editing interface
 * Handles username, display name, bio, profile picture, and privacy settings
 */
export function ProfileEditor({ onSave, onCancel, compact = false }) {
  const { 
    profile, 
    updateProfile, 
    checkUsernameAvailability, 
    uploadProfilePictureFile,
    updatePrivacySettings,
    loading 
  } = useUserProfile();
  
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    statusMessage: profile?.statusMessage || '',
    profilePictureURL: profile?.profilePictureURL || '',
    profileVisibility: profile?.profileVisibility || 'public',
    showEmail: profile?.showEmail ?? false,
    showLastActive: profile?.showLastActive ?? true
  });
  
  const [validationState, setValidationState] = useState({
    username: { valid: true, message: '', checking: false }
  });
  
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Handle form field changes
  const handleChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time username validation
    if (field === 'username') {
      if (!value.trim()) {
        setValidationState(prev => ({
          ...prev,
          username: { valid: false, message: 'Username is required', checking: false }
        }));
        return;
      }
      
      if (value === profile?.username) {
        setValidationState(prev => ({
          ...prev,
          username: { valid: true, message: '', checking: false }
        }));
        return;
      }
      
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, message: 'Checking availability...', checking: true }
      }));
      
      try {
        const result = await checkUsernameAvailability(value);
        setValidationState(prev => ({
          ...prev,
          username: {
            valid: result.available,
            message: result.error || (result.available ? 'Username available!' : ''),
            checking: false
          }
        }));
      } catch (err) {
        setValidationState(prev => ({
          ...prev,
          username: { valid: false, message: 'Error checking username', checking: false }
        }));
      }
    }
  };

  // Handle profile picture file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
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
      // Create preview URL for immediate feedback
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      setSaving(true);
      
      // Upload to Firebase Storage and update profile
      const downloadURL = await uploadProfilePictureFile(file);
      
      // Update form data with the real URL
      setFormData(prev => ({ ...prev, profilePictureURL: downloadURL }));
      
      // Clean up preview URL
      URL.revokeObjectURL(url);
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

  // Handle form submission
  const handleSave = async () => {
    if (!validationState.username.valid || validationState.username.checking) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Update profile data
      await updateProfile({
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio,
        statusMessage: formData.statusMessage,
        profilePictureURL: formData.profilePictureURL
      });
      
      // Update privacy settings separately
      await updatePrivacySettings({
        profileVisibility: formData.profileVisibility,
        showEmail: formData.showEmail,
        showLastActive: formData.showLastActive
      });
      
      onSave?.();
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="profile-editor loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const currentAvatar = previewUrl || formData.profilePictureURL || 'https://via.placeholder.com/150x150?text=👤';

  return (
    <div className={`profile-editor ${compact ? 'compact' : ''}`}>
      <div className="profile-editor-header">
        <h2>Edit Profile</h2>
        {compact && (
          <button 
            type="button" 
            className="close-button"
            onClick={onCancel}
            aria-label="Close profile editor"
          >
            ×
          </button>
        )}
      </div>

      <div className="profile-editor-content">
        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="avatar-container">
            <img 
              src={currentAvatar} 
              alt="Profile"
              className="profile-avatar"
              onClick={handleAvatarClick}
            />
            <div className="avatar-overlay" onClick={handleAvatarClick}>
              <span>📷 Change</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <p className="avatar-hint">Click to change profile picture</p>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Enter a unique username"
              className={`form-input ${!validationState.username.valid ? 'invalid' : ''}`}
              disabled={saving}
            />
            <div className={`validation-message ${validationState.username.valid ? 'valid' : 'invalid'}`}>
              {validationState.username.checking && <span className="spinner-small"></span>}
              {validationState.username.message}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="Your full name (optional)"
              className="form-input"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              className="form-textarea"
              rows={3}
              maxLength={500}
              disabled={saving}
            />
            <div className="char-count">{formData.bio.length}/500</div>
          </div>

          {/* Status Message - Temporarily removed per user request
          <div className="form-group">
            <label htmlFor="statusMessage">Status Message</label>
            <input
              id="statusMessage"
              type="text"
              value={formData.statusMessage}
              onChange={(e) => handleChange('statusMessage', e.target.value)}
              placeholder="What's your current status?"
              className="form-input"
              maxLength={100}
              disabled={saving}
            />
          </div>
          */}
        </div>

        {/* Privacy Settings */}
        {!compact && (
          <div className="form-section">
            <h3>Privacy Settings</h3>
            
            <div className="form-group">
              <label htmlFor="profileVisibility">Profile Visibility</label>
              <select
                id="profileVisibility"
                value={formData.profileVisibility}
                onChange={(e) => handleChange('profileVisibility', e.target.value)}
                className="form-select"
                disabled={saving}
              >
                <option value="public">Public - Anyone can see your profile</option>
                <option value="friends">Friends Only - Only friends can see your profile</option>
                <option value="private">Private - Only you can see your profile</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.showEmail}
                  onChange={(e) => handleChange('showEmail', e.target.checked)}
                  disabled={saving}
                />
                <span className="checkbox-text">Show email address on profile</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.showLastActive}
                  onChange={(e) => handleChange('showLastActive', e.target.checked)}
                  disabled={saving}
                />
                <span className="checkbox-text">Show when I was last active</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="profile-editor-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button-primary"
          onClick={handleSave}
          disabled={saving || !validationState.username.valid || validationState.username.checking}
        >
          {saving ? (
            <>
              <span className="spinner-small"></span>
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </button>
      </div>
    </div>
  );
}

export default ProfileEditor;