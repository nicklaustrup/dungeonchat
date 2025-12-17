import React, { useState, useRef } from "react";
import { CircleCheck, Hourglass } from "lucide-react";
import { useCachedUserProfile } from "../../services/cache";
import "./ProfileEditor.css";

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * ProfileEditor - Comprehensive profile editing interface
 * Handles username, display name, bio, profile picture, and privacy settings
 */
export function ProfileEditor({ onSave, onCancel, compact = false }) {
  const {
    profile,
    updateProfile,
    checkUsernameAvailability,
    uploadPicture: uploadProfilePictureFile,
    updatePrivacySettings,
    loading,
  } = useCachedUserProfile();

  const [formData, setFormData] = useState({
    username: profile?.username || "",
    bio: profile?.bio || "",
    statusMessage: profile?.statusMessage || "",
    profilePictureURL: profile?.profilePictureURL || "",
    profileVisibility: profile?.profileVisibility || "public",
    showEmail: profile?.showEmail ?? false,
    showLastActive: profile?.showLastActive ?? true,
  });

  const [validationState, setValidationState] = useState({
    username: { valid: true, message: "", checking: false },
  });

  // Cache for validated usernames: { username: { valid: boolean, timestamp: number } }
  const [usernameCache, setUsernameCache] = useState({});

  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Check if username is in cache and still valid
  const isCachedAndValid = (username) => {
    if (!username) return false;

    const cached = usernameCache[username];
    if (!cached) return false;

    const now = Date.now();
    const isExpired = now - cached.timestamp > CACHE_TTL;

    return !isExpired && cached.valid;
  };

  // Handle form field changes (no auto-validation for username)
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Reset username validation when typing (but don't auto-validate)
    if (field === "username") {
      if (!value.trim()) {
        setValidationState((prev) => ({
          ...prev,
          username: {
            valid: false,
            message: "Username is required",
            checking: false,
          },
        }));
        return;
      }

      if (value === profile?.username) {
        setValidationState((prev) => ({
          ...prev,
          username: { valid: true, message: "", checking: false },
        }));
        return;
      }

      // Check cache for previously validated username
      if (isCachedAndValid(value)) {
        setValidationState((prev) => ({
          ...prev,
          username: {
            valid: true,
            message: "✓ Username available!",
            checking: false,
          },
        }));
        return;
      }

      // Reset validation state but don't check yet
      setValidationState((prev) => ({
        ...prev,
        username: {
          valid: false,
          message: "Click \"Check Availability\" to validate",
          checking: false,
        },
      }));
    }
  };

  // Manual username validation
  const handleCheckUsername = async () => {
    const username = formData.username;

    if (!username || !username.trim()) {
      setValidationState((prev) => ({
        ...prev,
        username: {
          valid: false,
          message: "Username is required",
          checking: false,
        },
      }));
      return;
    }

    if (username === profile?.username) {
      setValidationState((prev) => ({
        ...prev,
        username: { valid: true, message: "", checking: false },
      }));
      return;
    }

    // Check cache first
    if (isCachedAndValid(username)) {
      setValidationState((prev) => ({
        ...prev,
        username: {
          valid: true,
          message: "✓ Username available!",
          checking: false,
        },
      }));
      return;
    }

    setValidationState((prev) => ({
      ...prev,
      username: {
        valid: false,
        message: "Checking availability...",
        checking: true,
      },
    }));

    try {
      const result = await checkUsernameAvailability(username);

      // Cache the result
      setUsernameCache((prev) => ({
        ...prev,
        [username]: {
          valid: result.available,
          timestamp: Date.now(),
        },
      }));

      setValidationState((prev) => ({
        ...prev,
        username: {
          valid: result.available,
          message:
            result.error || (result.available ? "✓ Username available!" : ""),
          checking: false,
        },
      }));
    } catch (err) {
      setValidationState((prev) => ({
        ...prev,
        username: {
          valid: false,
          message: "Error checking username",
          checking: false,
        },
      }));
    }
  };

  // Handle profile picture file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB");
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
      setFormData((prev) => ({ ...prev, profilePictureURL: downloadURL }));

      // Clean up preview URL
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture: " + error.message);

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

      // Re-validate username if cache is expired
      const username = formData.username;
      if (username !== profile?.username && !isCachedAndValid(username)) {
        setValidationState((prev) => ({
          ...prev,
          username: {
            ...prev.username,
            checking: true,
            message: "Validating username...",
          },
        }));

        const result = await checkUsernameAvailability(username);

        if (!result.available) {
          setValidationState((prev) => ({
            ...prev,
            username: {
              valid: false,
              message: result.error || "Username no longer available",
              checking: false,
            },
          }));
          setSaving(false);
          alert("Username validation failed. Please check availability again.");
          return;
        }

        // Update cache
        setUsernameCache((prev) => ({
          ...prev,
          [username]: {
            valid: true,
            timestamp: Date.now(),
          },
        }));

        setValidationState((prev) => ({
          ...prev,
          username: {
            valid: true,
            message: "✓ Username available!",
            checking: false,
          },
        }));
      }

      // Update profile data
      await updateProfile({
        username: formData.username,
        bio: formData.bio,
        statusMessage: formData.statusMessage,
        profilePictureURL: formData.profilePictureURL,
      });

      // Update privacy settings separately
      await updatePrivacySettings({
        profileVisibility: formData.profileVisibility,
        showEmail: formData.showEmail,
        showLastActive: formData.showLastActive,
      });

      onSave?.();
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Error saving profile: " + err.message);
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

  const currentAvatar =
    previewUrl || formData.profilePictureURL || "/logo192.png";

  return (
    <div className={`profile-editor ${compact ? "compact" : ""}`}>
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
            style={{ display: "none" }}
          />
          <p className="avatar-hint">Click to change profile picture</p>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <div className="username-input-container">
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Enter a unique username (e.g., dragonslayer92)"
                className={`form-input ${!validationState.username.valid ? "invalid" : ""}`}
                disabled={saving}
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]{3,30}"
              />
              <button
                type="button"
                className="check-availability-btn"
                onClick={handleCheckUsername}
                disabled={
                  saving ||
                  validationState.username.checking ||
                  !formData.username ||
                  formData.username === profile?.username ||
                  isCachedAndValid(formData.username)
                }
              >
                {validationState.username.checking ? (
                  <Hourglass />
                ) : (
                  <CircleCheck />
                )}
              </button>
            </div>
            <small className="field-help">
              3-30 characters: letters, numbers, and underscores only. Click
              "Check" to validate.
            </small>
            <div
              className={`validation-message ${validationState.username.valid ? "valid" : "invalid"}`}
            >
              {validationState.username.checking && (
                <span className="spinner-small"></span>
              )}
              {validationState.username.message}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
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
                onChange={(e) =>
                  handleChange("profileVisibility", e.target.value)
                }
                className="form-select"
                disabled={saving}
              >
                <option value="public">
                  Public - Anyone can see your profile
                </option>
                <option value="friends">
                  Friends Only - Only friends can see your profile
                </option>
                <option value="private">
                  Private - Only you can see your profile
                </option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.showEmail}
                  onChange={(e) => handleChange("showEmail", e.target.checked)}
                  disabled={saving}
                />
                <span className="checkbox-text">
                  Show email address on profile
                </span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.showLastActive}
                  onChange={(e) =>
                    handleChange("showLastActive", e.target.checked)
                  }
                  disabled={saving}
                />
                <span className="checkbox-text">
                  Show when I was last active
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="profile-editor-actions">
        <button
          type="button"
          className="button-primary"
          onClick={handleSave}
          disabled={
            saving ||
            !validationState.username.valid ||
            validationState.username.checking
          }
        >
          {saving ? (
            <>
              <span className="spinner-small"></span>
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </div>
  );
}

export default ProfileEditor;
